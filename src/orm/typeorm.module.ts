import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TxTask } from "./tx-task.entity";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        return {
          type: 'postgres',
          url: configService.getOrThrow('POSTGRES_URL') + '?sslmode=require',
          // host: configService.getOrThrow('POSTGRES_HOST'),
          // port: configService.get('POSTGRES_PORT', 5432),
          // username: configService.getOrThrow('POSTGRES_USER'),
          // password: configService.getOrThrow('POSTGRES_PASSWORD'),
          // database: configService.getOrThrow('POSTGRES_DATABASE'),
          synchronize: true,
          autoLoadEntities: true,
          // ssl: true,
        }
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      TxTask
    ]),
  ],
  controllers: [],
  providers: [],
  exports: [
    TypeOrmModule.forFeature([
      TxTask
    ]),
  ]
})
export class CustomTypeOrmModule {}