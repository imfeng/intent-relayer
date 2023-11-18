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

const CHAIN_MAP = {
  5: 'https://ethereum-goerli.publicnode.com',
  42161: 'https://arbitrum-one.publicnode.com	', // Arbitrum One Testnet
  534351: 'https://scroll-sepolia.blockpi.network/v1/rpc/public', // Scroll sepolia
  59140: 'https://rpc.goerli.linea.build', // Linea
  1442: 'https://rpc.public.zkevm-test.net', // polygon zkEVM
  100: 'https://1rpc.io/gnosis', // gnosis
};

@Injectable()
export class AppService {
  signer: Wallet;
  ERC20PERMIT_ADDRESS!: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: CustomLogger,
    @InjectRepository(TxTask)
    private readonly txTaskRepository: Repository<TxTask>,
  ) {
    const priv = this.configService.getOrThrow<string>('PRIV');
    this.ERC20PERMIT_ADDRESS = this.configService.getOrThrow<string>(
      'ERC20PERMIT_ADDRESS',
    );
    // const contactA
    this.signer = new Wallet(priv);
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
    if (txDto.value !== '0') {
      throw new BadRequestException('value must be 0');
    }
    if (txDto.toAddress !== this.ERC20PERMIT_ADDRESS) {
      throw new BadRequestException(
        `toAddress must be ${this.ERC20PERMIT_ADDRESS}`,
      );
    }
    const provideUrl = this.getProviderUrl(txDto.chainId);

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
        to: this.ERC20PERMIT_ADDRESS,
        // gasPrice: txDto.fee,
        // value: txDto.value,
        data: txDto.calldata,
      });
    this.logger.log(
      {
        permitTxReceipt,
      },
      'AppService.doPermit',
    );
    const permitTxResultPromise = permitTxReceipt.wait();
    await permitTxResultPromise;

    const transferTxReceipt = await this.signer
      .connect(provider)
      .sendTransaction({
        from: this.signer.address,
        to: this.ERC20PERMIT_ADDRESS,
        data: transferCalldata,
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
