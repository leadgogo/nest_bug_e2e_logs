import { Plugin } from '@nestjs/graphql';
import {
  ApolloServerPlugin,
  GraphQLRequestContext,
  GraphQLRequestListener,
} from 'apollo-server-plugin-base';
import { NotFoundApiError } from '../../errors/api-error/not-found.api-error';

export class LoaderBag<
  TId extends number | string = number | string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TGetterResult extends Record<string | number, any> = Record<
    string | number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  >
> {
  private populateMap: Record<
    string,
    {
      ids: TId[];
      promise: Promise<TGetterResult>;
    }
  > = {};

  async load(
    entityName: string,
    fields: string[],
    id: TId,
    getter: (ids: TId[]) => Promise<TGetterResult>
  ): Promise<TGetterResult> {
    const key = `${entityName}:{${fields.join(',')}}`;
    let mapEntry = this.populateMap[key];
    if (!mapEntry) {
      const ids: TId[] = [];
      const promise = new Promise<TGetterResult>((resolve, reject) => {
        process.nextTick(async () => {
          delete this.populateMap[key];
          try {
            const obj = await getter(Array.from(new Set(ids)));
            resolve(obj);
          } catch (error) {
            reject(error);
          }
        });
      });
      mapEntry = this.populateMap[key] = {
        ids,
        promise,
      };
    }
    const { ids: mIds, promise } = mapEntry;
    mIds.push(id);
    const obj = await promise;
    const row = obj[id];
    if (typeof row === 'undefined') {
      throw new NotFoundApiError();
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return row;
  }
}

@Plugin()
export class LoaderPlugin implements ApolloServerPlugin {
  requestDidStart(ctx: GraphQLRequestContext): GraphQLRequestListener {
    const {
      context: { req },
    } = ctx;
    req._loaderBag = new LoaderBag();
    return {};
  }
}
