import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
export interface TxTaskData {
  requestType: 'permit' | 'swap';
  relayerRequest: {
    chainId: number;
    toAddress: string;
    calldata: string;
    fee?: string;
    feeToken?: string;
    value?: string;
  },
  tasks: Array<{
    tx: {
      from: string;
      to: string;
      data: string;
    },
    receipt?: {
      chainId: number;
      signature: string;
      hash: string;
      to: string;
      from: string;
      nonce: number;
      gasLimit: string;
      gasPrice: string;
      data: string;
      value: string;
    },
    result?: {
      chainId: number;
      blockNumber: number;
      signature: string;
      hash: string;
      to: string;
      from: string;
      nonce: number;
      gasLimit: string;
      gasPrice: string;
      gasUsed: string;
      data: string;
      value: string;
    }
  }>
}
@Entity('tx_task')
export class TxTask {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, name: 'user_address' })
  userAddress: string;

  @Column({ type: 'jsonb', name: 'task_data' })
  taskData: TxTaskData;

  @Column({ type: 'varchar', length: 20, name: 'status' })
  status: 'pending' | 'running' | 'success' | 'failed';

  
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
