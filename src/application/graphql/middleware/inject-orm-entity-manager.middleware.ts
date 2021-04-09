import { EntityManager } from '@mikro-orm/core';
import { Injectable, NestMiddleware } from '@nestjs/common';
// import { EntityManager } from '@mikro-orm/mysql';

export const ormEmSymbol = Symbol('ormEm');

@Injectable()
export class InjectOrmEntityManagerMiddleware implements NestMiddleware {
  constructor(private em: EntityManager) {}

  use(req: Request, res: Response, next: Function) {
    req[ormEmSymbol] = this.em;
    next();
  }
}
