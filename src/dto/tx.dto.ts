import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RelayerTxDto {
  @ApiProperty()
  chainId: number;
  @ApiProperty()
  toAddress: string;
  @ApiProperty()
  calldata: string;
  @ApiPropertyOptional()
  fee?: string;
  @ApiPropertyOptional()
  feeToken?: string;
  @ApiPropertyOptional()
  value?: string;
}

export class RelayerTxResponse {
  @ApiProperty()
  txHash: string;
}