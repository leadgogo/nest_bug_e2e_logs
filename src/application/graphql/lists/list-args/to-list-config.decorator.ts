import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { defined, assertIsDefined, isDefined } from '@leadgogo/backend-utils';
import { GraphQLObjectType } from 'graphql';
import graphqlFields from 'graphql-fields';
import { getRequestedFields } from 'src/application/graphql/decorators/requested-fields.decorator';
import { getRealType } from 'src/application/graphql/helpers/get-real-type.helper';
import { BaseListArgs } from 'src/application/graphql/lists/list-args/base-list-args.class';
import { ListConfig } from 'src/application/graphql/lists/list-args/list-config.type';
import {
  Direction,
  PaginationConfiguration,
} from 'src/application/pagination/base.paginator';
import { QueryConfiguration } from 'src/types/query-config.interface';

export interface ToListConfig {
  (listArgs: BaseListArgs): ListConfig;
}

export const ToListConfig = createParamDecorator(
  (param: never, ctx: ExecutionContext) => {
    const fn: ToListConfig = (args: BaseListArgs) => {
      const gqlContext = GqlExecutionContext.create(ctx);
      const info = gqlContext.getInfo();
      const connectionType = getRealType(info.returnType) as GraphQLObjectType;
      const [, nodeField] = defined(
        Object.entries(connectionType.getFields()).find(
          ([name]) => name === 'nodes'
        )
      );
      const returnType = getRealType(nodeField.type);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const requestedRootGraphQlFields = graphqlFields(info);
      const wasTotalCountRequested = !!requestedRootGraphQlFields.totalCount;
      const wasEdgesRequested = !!requestedRootGraphQlFields.edges?.node;
      const wasNodesRequested = !!requestedRootGraphQlFields.nodes;

      const requestedEdgesFields = wasEdgesRequested
        ? getRequestedFields(
            returnType,
            requestedRootGraphQlFields.edges?.node,
            true
          )
        : [];
      const requestedNodesFields = wasNodesRequested
        ? getRequestedFields(returnType, requestedRootGraphQlFields.nodes, true)
        : [];

      const mergedRequestedFields = Array.from(
        new Set(requestedEdgesFields.concat(requestedNodesFields))
      );
      const { where, orderBy, before, after, first, last } = args;

      const queryConfig: QueryConfiguration = {
        fields: mergedRequestedFields,
        where,
        orderBy,
      };

      let direction: Direction;
      let limit: number | undefined;
      let offsetCursor: string | undefined;

      if (isDefined(first)) {
        direction = 'forward';
        limit = first;
        if (isDefined(after)) {
          offsetCursor = after;
        }
      } else {
        direction = 'backward';
        limit = last;
        if (isDefined(before)) {
          offsetCursor = before;
        }
      }

      assertIsDefined(limit, 'Limit is not defined.');

      const paginationConfig: PaginationConfiguration = {
        offsetCursor,
        direction,
        limit,
        totalCountRequested: wasTotalCountRequested,
      };

      const result: ListConfig = {
        queryConfig,
        paginationConfig,
      };

      return result;
    };
    return fn;
  }
);
