import { Global, Injectable } from '@nestjs/common';

@Global()
@Injectable()
export class EmailService {
  constructor() {}

  send(to: string, subject: string, content: string) {}
}
