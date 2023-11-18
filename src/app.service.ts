import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Contract,
  Interface,
  JsonRpcProvider,
  TransactionReceipt,
  TransactionResponse,
  Wallet,
} from 'ethers';
import { CustomLogger } from './service/console-logger.service';
import { RelayerTxDto } from './dto/tx.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TxTask } from './orm/tx-task.entity';
import { ERC20PermitContractInterface } from './contracts/erc20-permit.abi';

export enum CHAIN_ID {
  GOERLI = 5,
  ARBITRUM_GOERLI = 421613,
  SCROLL_SEPOLIA = 534351,
  LINEA_TESTNET = 59140,
  POLYGON_ZKEVM_TESTNET = 1442,
  GNOSIS = 100,
  MANTLE_TESTNET = 5001,
  BASE_GOERLI = 84531,
  ZKSYNC_GOERLI = 280,
}

const CHAIN_MAP = {
  [CHAIN_ID.GOERLI]: 'https://ethereum-goerli.publicnode.com',
  [CHAIN_ID.ARBITRUM_GOERLI]: 'https://arbitrum-one.publicnode.com	', // Arbitrum One Testnet
  [CHAIN_ID.SCROLL_SEPOLIA]:
    'https://scroll-sepolia.blockpi.network/v1/rpc/public', // Scroll sepolia
  [CHAIN_ID.LINEA_TESTNET]: 'https://rpc.goerli.linea.build', // Linea
  [CHAIN_ID.POLYGON_ZKEVM_TESTNET]: 'https://rpc.public.zkevm-test.net', // polygon zkEVM
  [CHAIN_ID.GNOSIS]: 'https://1rpc.io/gnosis', // gnosis
  [CHAIN_ID.MANTLE_TESTNET]: 'https://rpc.testnet.mantle.xyz', // mantle testnet
  [CHAIN_ID.BASE_GOERLI]: 'https://base-goerli.publicnode.com', // base goerli
  [CHAIN_ID.ZKSYNC_GOERLI]: 'https://zksync-era-testnet.blockpi.network/v1/rpc/public', // zksync goerli
};

export const ERC20PERMIT_ADDRESS = {
  [CHAIN_ID.GOERLI]: '0x9Fda380dEE070cDc213840D770D5BD010B56D642',
  [CHAIN_ID.ARBITRUM_GOERLI]: '0xeEd9Bc2C923f4d12fD857D73f5DC4736AF661784',
  [CHAIN_ID.SCROLL_SEPOLIA]: '0x3f39d5652ad8665b663869f3231cd131a0ec909d',
  [CHAIN_ID.LINEA_TESTNET]: '0x419c2e4d9e9d272e20c894c788f31cf7ed1c1eaf',
  [CHAIN_ID.POLYGON_ZKEVM_TESTNET]:
    '0x419c2e4d9e9d272e20c894c788f31cf7ed1c1eaf',
  [CHAIN_ID.GNOSIS]: '0x419c2e4d9e9d272e20c894c788f31cf7ed1c1eaf',
  [CHAIN_ID.MANTLE_TESTNET]: '0x3e2229ab2dcc01f6df19fa189e3025c14a816816',
  [CHAIN_ID.BASE_GOERLI]: '0x3E2229AB2DCC01F6DF19fa189E3025c14A816816',
  [CHAIN_ID.ZKSYNC_GOERLI]: '0xCbcD005577FcbC675C560966291bb93dEab348E7',
};

@Injectable()
export class AppService {
  signer: Wallet;
  spenderSigner: Wallet;
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: CustomLogger,
    @InjectRepository(TxTask)
    private readonly txTaskRepository: Repository<TxTask>,
  ) {
    const priv = this.configService.getOrThrow<string>('PRIV');
    // const contactA
    this.signer = new Wallet(priv);

    const spenderPriv = this.configService.getOrThrow<string>('SPEND_PRIV');
    this.spenderSigner = new Wallet(spenderPriv);
    this.test();
  }

  async test() {
    const r = await this.getTxTask(1);
    this.logger.log(
      {
        r,
      },
      'AppService.test',
    );
  }

  async getTxTask(id: number) {
    return await this.txTaskRepository.findOne({
      where: {
        id,
      },
    });
  }

  getProviderUrl(chainId: number) {
    const providerUrl = CHAIN_MAP[chainId];
    if (!providerUrl) {
      throw new BadRequestException(`unsupported chain=${chainId}`);
    }
    return providerUrl;
  }

  async doPermit(txDto: RelayerTxDto) {
    const provideUrl = this.getProviderUrl(txDto.chainId);
    if (txDto.value !== '0') {
      throw new BadRequestException('value must be 0');
    }
    const permitAddress = ERC20PERMIT_ADDRESS[txDto.chainId];
    if (!permitAddress) {
      throw new BadRequestException(`unsupported chain=${txDto.chainId}`);
    }
    if (txDto.toAddress !== permitAddress) {
      throw new BadRequestException(`toAddress must be ${permitAddress}`);
    }

    const provider = new JsonRpcProvider(provideUrl);
    const {
      owner,
      spender,
      value: approveValue,
    } = ERC20PermitContractInterface.decodeFunctionData(
      'permit',
      txDto.calldata,
    );
    const transferCalldata = ERC20PermitContractInterface.encodeFunctionData(
      'transferFrom',
      [owner, spender, approveValue],
    );

    this.logger.log(
      {
        owner,
        spender,
        approveValue,
      },
      'AppService.doPermit',
    );

    const permitTxReceipt = await this.signer
      .connect(provider)
      .sendTransaction({
        from: this.signer.address,
        to: permitAddress,
        // gasPrice: txDto.fee,
        // value: txDto.value,
        data: txDto.calldata,
        type: CHAIN_ID.SCROLL_SEPOLIA === txDto.chainId ? 0 : undefined,
      });
    this.logger.log(
      {
        permitTxReceipt,
      },
      'AppService.doPermit',
    );
    const permitTxResultPromise = permitTxReceipt.wait();
    await permitTxResultPromise;

    const transferTxReceipt = await this.spenderSigner
      .connect(provider)
      .sendTransaction({
        from: this.spenderSigner.address,
        to: permitAddress,
        data: transferCalldata,
        type: CHAIN_ID.SCROLL_SEPOLIA === txDto.chainId ? 0 : undefined,
      });
    this.logger.log(
      {
        transferTxReceipt,
      },
      'AppService.doPermit',
    );
    const transferTxResultPromise = transferTxReceipt.wait();
    await transferTxResultPromise;

    const response = {
      permitTxReceipt: permitTxReceipt.toJSON(),
      transferTxReceipt: transferTxReceipt.toJSON(),
    };

    this.logger.log(
      {
        response,
      },
      'AppService.doPermit',
    );
    return response;
  }

  getHello(): string {
    return 'Hello World!';
  }
}
