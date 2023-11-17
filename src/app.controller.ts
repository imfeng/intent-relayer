import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiCreatedResponse, ApiOperation, ApiProperty, ApiPropertyOptional, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Contract, JsonRpcProvider, Wallet, AbiCoder, Interface } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { CustomLogger } from './service/console-logger.service';
import * as ERC20ABI from './abi.json';
import { RelayerTxDto, RelayerTxResponse } from './dto/tx.dto';

@ApiTags('Main')
@Controller()
export class AppController {
  signer: Wallet;

  constructor(
    private readonly configService: ConfigService,
    private readonly appService: AppService,
    private readonly logger: CustomLogger,
  ) {
    const priv = this.configService.getOrThrow<string>('PRIV');
    // const contactA
    this.signer = new Wallet(priv);
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  getHealth(): string {
    return 'OK';
  }

  @Post('send-tx')
  @ApiOperation({ summary: 'Send transaction' })
  @ApiCreatedResponse({
    type: RelayerTxResponse,
  })
  // @ApiResponse({ status: 200, description: 'Transaction hash', schema: { type: 'string' }  })
  async sendTransaction(@Body() txDto: RelayerTxDto) {
    this.logger.log({
      message: 'sendTransaction',
      txDto,
    }, 'AppController.sendTransaction');

    return await this.appService.doPermit(txDto);
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
