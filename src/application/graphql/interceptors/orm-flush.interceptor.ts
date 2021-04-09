import { EntityManager } from '@mikro-orm/mysql';
import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { isGraphQL } from 'src/application/graphql/helpers/is-graphql.helper';
import { isMutation } from 'src/application/graphql/helpers/is-mutation.helper';
import { isResolvingGraphQLField } from 'src/application/graphql/helpers/is-resolving-graphql-field.helper';
import { ormEmSymbol } from 'src/application/graphql/middleware/inject-orm-entity-manager.middleware';

/**
 * Runs an implicit flush operation on the orm after every mutation so that
 * we don't need to explicitly call flush from within the mutation action
 * (from within a service method, for example).
 */
export class OrmFlushInterceptor implements NestInterceptor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    if (isGraphQL(ctx) && isMutation(ctx) && !isResolvingGraphQLField(ctx)) {
      const context = GqlExecutionContext.create(ctx).getContext();
      const em: EntityManager = context.req[ormEmSymbol];
      return next.handle().pipe(
        map(async (data: unknown) => {
          // eslint-disable-next-line @leadgogo/no-orm-flush
          await em.flush();
          return data;
        })
      );
    }
    return next.handle();
  }
}
