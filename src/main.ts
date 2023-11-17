import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { CustomLogger } from './service/console-logger.service';
import { resolve } from 'path';
import { writeFileSync, createWriteStream } from 'fs';
import { get } from 'http';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept',
  });

  const configService = app.get(ConfigService);
  const logger = app.get(CustomLogger);
  const port = configService.getOrThrow('PORT');

  const options = new DocumentBuilder()
    .setTitle('Intent Documentation')
    .setVersion('0.0.1')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('/swagger', app, document);

  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
}
bootstrap();

// function configureSwagger(serverUrl: string) {
//   // get the swagger json file (if app is running in development mode)
//   // write swagger ui files
//   get(`${serverUrl}/swagger/swagger-ui-bundle.js`, function (response) {
//     response.pipe(createWriteStream('swagger-static/swagger-ui-bundle.js'));
//     console.log(
//       `Swagger UI bundle file written to: '/swagger-static/swagger-ui-bundle.js'`,
//     );
//   });

//   get(`${serverUrl}/swagger/swagger-ui-init.js`, function (response) {
//     response.pipe(createWriteStream('swagger-static/swagger-ui-init.js'));
//     console.log(
//       `Swagger UI init file written to: '/swagger-static/swagger-ui-init.js'`,
//     );
//   });

//   get(
//     `${serverUrl}/swagger/swagger-ui-standalone-preset.js`,
//     function (response) {
//       response.pipe(
//         createWriteStream('swagger-static/swagger-ui-standalone-preset.js'),
//       );
//       console.log(
//         `Swagger UI standalone preset file written to: '/swagger-static/swagger-ui-standalone-preset.js'`,
//       );
//     },
//   );

//   get(`${serverUrl}/swagger/swagger-ui.css`, function (response) {
//     response.pipe(createWriteStream('swagger-static/swagger-ui.css'));
//     console.log(
//       `Swagger UI css file written to: '/swagger-static/swagger-ui.css'`,
//     );
//   });
// }
