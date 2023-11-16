import { Injectable, Scope, ConsoleLogger } from '@nestjs/common';

@Injectable({ scope: Scope.DEFAULT })
export class CustomLogger extends ConsoleLogger {
  customLog() {
    this.log('Please feed the cat!');
  }
}