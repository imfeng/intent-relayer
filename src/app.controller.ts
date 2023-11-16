import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiCreatedResponse, ApiOperation, ApiProperty, ApiPropertyOptional, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Wallet } from 'ethers';

class SendTxDto {
  @ApiProperty()
  from: string;

  @ApiProperty()
  to: string;

  @ApiProperty()
  fee: string;

  @ApiProperty()
  value: string;

  @ApiPropertyOptional()
  gasPrice?: string;

  @ApiProperty()
  calldata: string;
}

class SendTxResponse {
  @ApiProperty()
  txHash: string;
}

@ApiTags('Main')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  getHealth(): string {
    return 'OK';
  }

  @Post('send-tx')
  @ApiOperation({ summary: 'Send transaction' })
  @ApiCreatedResponse({
    type: SendTxResponse,
  })
  // @ApiResponse({ status: 200, description: 'Transaction hash', schema: { type: 'string' }  })
  async sendTransaction(@Body() txDto: SendTxDto) {
    const signer = Wallet.createRandom();
    const sig = await signer.sendTransaction({
      from: txDto.from,
      to: txDto.to,
      gasPrice: txDto.fee,
      value: txDto.value,
      data: txDto.calldata,
    });
    return new BadRequestException('Not implemented');
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
