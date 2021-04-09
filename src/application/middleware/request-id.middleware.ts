import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

export const requestIdSymbol = Symbol('requestId');

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: Function) {
    req[requestIdSymbol] = uuid();
    next();
  }
}
