import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLResolveInfo } from 'graphql';
import graphqlFields from 'graphql-fields';
import { LoaderBag } from '../plugins/loader.plugin';
import { getRealType } from '../helpers/get-real-type.helper';
import { isDefined } from '@leadgogo/backend-utils';

export interface Loader<
  TId extends string | number,
  GetterValue,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TIdParam extends TId | undefined | null = any
> {
  (
    id: TIdParam,
    getter: (ids: TId[]) => Promise<Record<TId, GetterValue>>
  ): Promise<
    GetterValue extends Array<unknown>
      ? GetterValue
      : TIdParam extends undefined | null
      ? undefined
      : GetterValue
  >;
}

export const Loader = createParamDecorator(
  (data: undefined, ctx: ExecutionContext) => {
    const { _loaderBag: loaderBag } = ctx.getArgByIndex(2).req as {
      _loaderBag: LoaderBag;
    };
    const info = GqlExecutionContext.create(ctx).getInfo<GraphQLResolveInfo>();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const fields = Object.keys(graphqlFields(info));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn: Loader<any, any> = async (id, getter) => {
      if (!isDefined(id)) {
        return;
      }
      const row = await loaderBag.load(
        getRealType(info.returnType).name,
        fields,
        id,
        getter
      );
      return row;
    };
    return fn;
  }
);
