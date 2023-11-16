import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { CustomLogger } from './service/console-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = app.get(CustomLogger);
  const port = configService.getOrThrow('PORT');

  const options = new DocumentBuilder()
      .setTitle('Intent Documentation')
      .setVersion('0.0.1')
      .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
}
bootstrap();
