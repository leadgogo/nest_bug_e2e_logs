/* eslint-disable */
import mem from 'mem';
import { Inject } from '@nestjs/common';
import serialize from 'serialize-javascript';
import { RedisService } from '@leadgogo/backend-utils';

export const redisCacheKeyPrefix = 'cached-decorator';

function deserialize(serializedJavascript: string) {
  return eval('(' + serializedJavascript + ')');
}

interface CachedOptions {
  /**
   * A callback that provides a custom cache key value.
   * It will receive the same arguments as the decorated method.
   */
  cacheKey?: (...args: any[]) => string | number;
  /** Duration of cache in memory. Default is 5 seconds. */
  localTtl?: number;
  /** Duration of cache in Redis in milliseconds. If not provided, Redis is not used. */
  redisTtl?: number;
  /**
   * Prefix to use for the key in Redis. The result of the cache key function
   * (implicit or not) will be appended to this. If not provided, a prefix based on
   * the class' and decorated method's names will be used. */
  redisPrefix?: string;
  /**
   * After fetching a cached entry from redis, use this function to further
   * process the returned value.
   */
  redisPostProcess?: (this: any, deserialized: any) => any;
}

/**
 * Caches the result of the method call in memory (5 seconds by default)
 * and optionally in Redis.
 *
 * @param [options] Options.
 */
export function cached(options: CachedOptions = {}) {
  const {
    cacheKey,
    localTtl = 5_000,
    redisTtl,
    redisPrefix,
    redisPostProcess,
  } = options;

  const injectRedisService = Inject(RedisService);
  const memCache = new Map();

  return function (
    target: Object,
    key: PropertyKey,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>,
  ) {
    const rawFunction = descriptor.value!;
    if (rawFunction.length > 1 && !cacheKey) {
      throw new Error(
        'Target method receives more than 1 argument. Please provide a cache key function.',
      );
    }
    const redisServicePropertyName = 'redisServiceForCachedDecorator';
    injectRedisService(target, redisServicePropertyName);
    const memCacheKey: any = cacheKey ? (args) => cacheKey(...args) : undefined;
    descriptor.value = mem(
      async function (this: Object, ...args): Promise<any> {
        const _cacheKey = cacheKey ? cacheKey(...args) : args[0];
        if (typeof _cacheKey !== 'string' && typeof _cacheKey !== 'number') {
          throw new Error(
            `Cache key must be either a string or a number. Got ${typeof _cacheKey}.`,
          );
        }
        const _redisPrefix =
          redisPrefix ??
          `${redisCacheKeyPrefix}:${target.constructor.name}:${key.toString()}`;
        const redisCacheKey = `${_redisPrefix}:${_cacheKey}`;
        if (redisTtl) {
          const redisService: RedisService = this[redisServicePropertyName];
          const redisClient = redisService.getClient();
          const serialized = await redisClient.get(redisCacheKey);
          if (serialized !== null) {
            let deserialized = deserialize(serialized);
            if (redisPostProcess) {
              deserialized = await redisPostProcess.call(this, deserialized);
            }
            return deserialized;
          }
        }
        const value = await rawFunction.apply(this, args);
        if (redisTtl) {
          const redisService: RedisService = this[redisServicePropertyName];
          const redisClient = redisService.getClient();
          const serialized = serialize(value);
          if (redisTtl === Infinity) {
            await redisClient.set(redisCacheKey, serialized);
          } else {
            await redisClient.psetex(redisCacheKey, redisTtl, serialized);
          }
        }
        return value;
      },
      {
        cacheKey: memCacheKey,
        maxAge: localTtl === Infinity ? undefined : localTtl,
        cache: memCache,
      },
    );
    (descriptor.value as any).memCache = memCache;
  };
}
