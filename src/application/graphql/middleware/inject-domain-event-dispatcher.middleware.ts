import { Injectable, NestMiddleware } from '@nestjs/common';
import { DomainEventService } from 'src/domain/utils/domain-events/domain-event.service';

export const domainEventsServiceSymbol = Symbol('domainEventDispatcherService');

@Injectable()
export class InjectDomainEventDispatcherMiddleware implements NestMiddleware {
  constructor(private domainEventDispatcherService: DomainEventService) {}

  use(req: Request, res: Response, next: Function) {
    req[domainEventsServiceSymbol] = this.domainEventDispatcherService;
    next();
  }
}
