import { EntityManager } from '@mikro-orm/mysql';
import { Logger } from '@nestjs/common';
import { Plugin } from '@nestjs/graphql';
import {
  ApolloServerPlugin,
  GraphQLRequestContext,
  GraphQLRequestListener,
} from 'apollo-server-plugin-base';
import { domainEventsServiceSymbol } from 'src/application/graphql/middleware/inject-domain-event-dispatcher.middleware';
import { ormEmSymbol } from 'src/application/graphql/middleware/inject-orm-entity-manager.middleware';
import { DomainEventService } from 'src/domain/utils/domain-events/domain-event.service';

// Documentation on explicit transaction handling:
// https://mikro-orm.io/docs/transactions/#approach-2-explicitly

@Plugin()
export class SqlTransactionForMutations implements ApolloServerPlugin {
  private logger = new Logger(this.constructor.name);

  requestDidStart(ctx: GraphQLRequestContext) {
    // http request event (called once)
    const em: EntityManager = ctx.context.req[ormEmSymbol];
    const domainEventService: DomainEventService =
      ctx.context.req[domainEventsServiceSymbol];
    let isMutation = false;
    let hadErrors = false;
    return {
      async didResolveOperation(ctx): Promise<void> {
        if (ctx.operation.operation === 'mutation') {
          isMutation = true;
          await em.begin();
        }
      },
      didEncounterErrors() {
        if (isMutation) {
          hadErrors = true;
        }
      },
      willSendResponse: async () => {
        if (isMutation) {
          if (hadErrors) {
            await em.rollback();
          } else {
            try {
              await domainEventService.dispatchAllEvents();
              // eslint-disable-next-line @leadgogo/no-orm-flush
              await em.commit();
            } catch (error) {
              await em.rollback();
              this.logger.error(error.message, error.stack);
              throw error;
            }
          }
        }
      },
    } as GraphQLRequestListener;
  }
}
