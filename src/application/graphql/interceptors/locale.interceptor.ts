import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { isGraphQL } from 'src/application/graphql/helpers/is-graphql.helper';
import { isResolvingGraphQLField } from 'src/application/graphql/helpers/is-resolving-graphql-field.helper';

export class LocaleInterceptor implements NestInterceptor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    if (isGraphQL(ctx) && !isResolvingGraphQLField(ctx)) {
      const context = GqlExecutionContext.create(ctx).getContext();
      context.locale = context.req.headers['accept-language'];
    }
    return next.handle();
  }
}
