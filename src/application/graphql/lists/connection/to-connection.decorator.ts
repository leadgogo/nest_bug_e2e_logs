import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import graphqlFields from 'graphql-fields';
import { Connection } from 'src/application/graphql/lists/connection/connection.type';
import { Page } from 'src/application/pagination/base.paginator';

export interface ToConnection<T> {
  (page: Page<T>): Connection<T>;
}

export const ToConnection = createParamDecorator(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <T = any>(param: never, ctx: ExecutionContext) => {
    const gqlContext = GqlExecutionContext.create(ctx);
    const info = gqlContext.getInfo();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const requestedRootGraphQlFields = graphqlFields(info);
    const wasEdgesRequested = !!requestedRootGraphQlFields.edges?.node;
    const wasNodesRequested = !!requestedRootGraphQlFields.nodes;

    const fn: ToConnection<T> = (page: Page<T>) => {
      const {
        totalCount,
        items,
        pages: { hasPrevious, hasNext },
      } = page;

      const connection: Connection<T> = {
        totalCount,
        pageInfo: {
          hasPreviousPage: hasPrevious,
          hasNextPage: hasNext,
          startCursor: items[0]?.cursor,
          endCursor: items[items.length - 1]?.cursor,
        },
      };
      if (wasEdgesRequested) {
        connection.edges = items.map(({ cursor, item }) => ({
          cursor,
          node: item,
        }));
      }
      if (wasNodesRequested) {
        connection.nodes = items.map(({ item }) => item);
      }
      return connection;
    };

    return fn;
  }
);
