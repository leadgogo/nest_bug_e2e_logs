import { ExecutionContext } from '@nestjs/common';
import { GqlContextType } from '@nestjs/graphql';

export function isGraphQL(ctx: ExecutionContext) {
  return ctx.getType<GqlContextType>() === 'graphql';
}
