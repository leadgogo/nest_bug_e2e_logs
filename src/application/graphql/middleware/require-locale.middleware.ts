import { BadRequestException, NestMiddleware } from '@nestjs/common';

export class RequireLocaleMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: Function) {
    if (!req.headers['accept-language']) {
      throw new BadRequestException('Accept language header mising.');
    }
    next();
  }
}
