/* eslint-disable */
import { ModuleRef } from '@nestjs/core';
import { Scope } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import mem from 'mem';
import { sleepMilliseconds } from 'sleepjs';
import serialize from 'serialize-javascript';
import { cached, redisCacheKeyPrefix } from './cached';
import { RedisService } from '@leadgogo/backend-utils';

class TestClass {
  async dataSource(): Promise<any> {
    return true;
  }

  @cached()
  testFnNoOptions(param1: any) {
    return this.dataSource();
  }

  // @ts-expect-error // requires function to return a promise
  @cached(Infinity)
  shouldShowError() {
    return 2;
  }

  @cached({ localTtl: 200 })
  async testFnSimple(param1: any) {
    return this.dataSource();
  }

  @cached({
    redisTtl: Infinity,
    cacheKey: (param1: string) => param1.toUpperCase(),
  })
  async testFnWithDefinedCacheKey(param1: string, param2: string) {
    return this.dataSource();
  }

  @cached({ localTtl: 200, redisTtl: 1_000 })
  async testFnWithRedis(param1: any) {
    return this.dataSource();
  }

  @cached({ cacheKey: () => ({ a: 1 } as any) })
  async testInvalidCacheKey(param1: string) {
    return this.dataSource();
  }

  @cached({
    cacheKey: (param1) => param1,
    redisTtl: Infinity,
    redisPrefix: 'some-prefix',
  })
  async testCustomRedixPrefixWithCacheKeyFn(param1: string) {
    return this.dataSource();
  }

  @cached({
    redisTtl: Infinity,
    redisPrefix: 'some-prefix',
  })
  async testCustomRedixPrefixWithoutCacheKeyFn(param1: string) {
    return this.dataSource();
  }
}

describe('Cached decorator', () => {
  let moduleRef: ModuleRef;
  let testClassInstance: TestClass;
  let testClassInstance2: TestClass;
  let redisClient: jest.Mocked<ReturnType<RedisService['getClient']>>;

  beforeEach(async () => {
    redisClient = {
      get: jest.fn(() => null),
      psetex: jest.fn(),
      set: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: RedisService,
          useValue: {
            getClient: () => redisClient,
          },
        },
        {
          provide: 'SUT',
          useClass: TestClass,
          scope: Scope.TRANSIENT,
        },
      ],
    }).compile();

    moduleRef = module.get<ModuleRef>(ModuleRef);
    testClassInstance = await moduleRef.resolve<TestClass>('SUT');
    testClassInstance2 = await moduleRef.resolve<TestClass>('SUT');

    mem.clear(testClassInstance.testFnSimple);
    mem.clear(testClassInstance.testFnWithDefinedCacheKey);
    mem.clear(testClassInstance.testFnWithRedis);
  });

  it('cache works', async () => {
    const dataSourceSpy = jest.spyOn(testClassInstance, 'dataSource');
    await testClassInstance.testFnNoOptions('param1');
    const result = await testClassInstance.testFnNoOptions('param1');
    expect(result).toEqual(true);
    expect(dataSourceSpy).toHaveBeenCalledTimes(1);
  });

  it('methods with 1 argument do not require a cache key function', () => {
    class Foo {
      @cached()
      async bar(param1: string) {
        return 'baz';
      }
    }
    const foo = new Foo();
    expect(foo).toBeTruthy();
  });

  it('methods with more than 1 argument require a cache key function', () => {
    try {
      class Foo {
        @cached()
        async bar(param1: string, param2: string) {
          return 'baz';
        }
      }
    } catch (error) {
      expect(error.message).toMatch(/provide a cache key/);
    }
    expect.assertions(1);
  });

  it('cache key function must provide a string or number value', () => {
    return expect(
      testClassInstance.testInvalidCacheKey('param1'),
    ).rejects.toThrow(/either a string or a number/);
  });

  it('test class instances are transient', () => {
    expect(testClassInstance === testClassInstance2).toEqual(false);
  });

  describe('local cache', () => {
    describe('defined cache key', () => {
      it('uses the expected local cache key', async () => {
        await testClassInstance.testFnWithDefinedCacheKey('param1', 'param2');
        const cache: Map<any, any> =
          testClassInstance.testFnWithDefinedCacheKey['memCache'];
        expect(cache.has('PARAM1')).toEqual(true);
      });
    });

    it('uses the expected local cache key for string param', async () => {
      await testClassInstance.testFnSimple('param1');
      const cache: Map<any, any> = testClassInstance.testFnSimple['memCache'];
      expect(cache.has('param1')).toEqual(true);
    });

    it('uses the expected local cache key for number param', async () => {
      await testClassInstance.testFnSimple(2);
      const cache: Map<any, any> = testClassInstance.testFnSimple['memCache'];
      expect(cache.has(2)).toEqual(true);
    });

    it('redis is not called', async () => {
      const redisSpy = jest.spyOn(redisClient, 'get');
      await testClassInstance.testFnSimple('param1');
      expect(redisSpy).not.toHaveBeenCalled();
    });

    it('is called twice with same params, dataSource is called once', async () => {
      const dataSourceSpy = jest.spyOn(testClassInstance, 'dataSource');
      await testClassInstance.testFnSimple('param1');
      await testClassInstance.testFnSimple('param1');
      expect(dataSourceSpy).toHaveBeenCalledTimes(1);
    });

    it('is called once from two TestClass instances with same params, dataSource is called once', async () => {
      const dataSourceSpy = jest.spyOn(testClassInstance, 'dataSource');
      await testClassInstance.testFnSimple('param1');
      await testClassInstance2.testFnSimple('param1');
      expect(dataSourceSpy).toHaveBeenCalledTimes(1);
    });

    it('is called twice with different params, dataSource is called twice', async () => {
      const dataSourceSpy = jest.spyOn(testClassInstance, 'dataSource');
      await testClassInstance.testFnSimple('param1');
      await testClassInstance.testFnSimple('param2');
      expect(dataSourceSpy).toHaveBeenCalledTimes(2);
    });

    it('cache lasts 1 second', async () => {
      const dataSourceSpy = jest.spyOn(testClassInstance, 'dataSource');
      await testClassInstance.testFnSimple('param1');
      await sleepMilliseconds(400);
      await testClassInstance.testFnSimple('param1');
      expect(dataSourceSpy).toHaveBeenCalledTimes(2);
    });

    it('with 2 calls, use dataSource once, use local cache once', async () => {
      const localCache: Map<any, any> =
        testClassInstance.testFnSimple['memCache'];
      const dataSourceSpy = jest.spyOn(testClassInstance, 'dataSource');

      dataSourceSpy.mockResolvedValueOnce('hello');
      dataSourceSpy.mockResolvedValueOnce('bye');

      const result = await testClassInstance.testFnSimple('simple1');
      const result2 = await testClassInstance.testFnSimple('simple1');

      expect(result).toEqual('hello');
      expect(result2).toEqual('hello');
      expect(dataSourceSpy).toHaveBeenCalledTimes(1);
      expect(localCache.has('simple1')).toEqual(true);

      dataSourceSpy.mockReset();
    });
  });

  describe('local and redis cache', () => {
    describe('defined cache key', () => {
      it('uses the expected redis cache key', async () => {
        await testClassInstance.testFnWithDefinedCacheKey('param1', 'param2');
        expect(redisClient.get).toHaveBeenCalledWith(
          `${redisCacheKeyPrefix}:TestClass:testFnWithDefinedCacheKey:PARAM1`,
        );
      });
    });

    describe('custom redis prefix', () => {
      it('uses the expected redis cache key with a custom cache key function', async () => {
        await testClassInstance.testCustomRedixPrefixWithCacheKeyFn('param1');
        expect(redisClient.get).toHaveBeenCalledWith(`some-prefix:param1`);
      });

      it('uses the expected redis cache key without a custom cache key function', async () => {
        await testClassInstance.testCustomRedixPrefixWithoutCacheKeyFn(
          'param1',
        );
        expect(redisClient.get).toHaveBeenCalledWith(`some-prefix:param1`);
      });
    });

    it('uses the expected redis cache key for string param', async () => {
      await testClassInstance.testFnWithRedis('param1');
      expect(redisClient.get).toHaveBeenCalledWith(
        `${redisCacheKeyPrefix}:TestClass:testFnWithRedis:param1`,
      );
    });

    it('uses the expected redis cache key for number param', async () => {
      await testClassInstance.testFnWithRedis(2);
      expect(redisClient.get).toHaveBeenCalledWith(
        `${redisCacheKeyPrefix}:TestClass:testFnWithRedis:2`,
      );
    });

    it('redis is called', async () => {
      const dataSourceSpy = jest.spyOn(testClassInstance, 'dataSource');

      await testClassInstance.testFnWithRedis('param1');

      expect(redisClient.get).toHaveBeenCalledTimes(1);
      expect(redisClient.get).toHaveReturnedWith(null);
      expect(dataSourceSpy).toHaveBeenCalledTimes(1);
      expect(redisClient.set).toHaveBeenCalledTimes(0);
      expect(redisClient.psetex).toHaveBeenCalledTimes(1);
    });

    it('can store and return an object', async () => {
      const obj = { a: 1, b: 2 };
      redisClient.get.mockResolvedValueOnce(serialize(obj));
      const result = await testClassInstance.testFnWithRedis('param1');
      expect(result).toEqual(obj);
    });

    it('can store and return a Date object', async () => {
      const date = new Date();
      redisClient.get.mockResolvedValueOnce(serialize(date));
      const result: Date = await testClassInstance.testFnWithRedis('param1');
      expect(result.getTime()).toEqual(date.getTime());
    });

    it('with 3 calls including a delay, use a combination of local and redis cache, never use dataSource', async () => {
      redisClient.get.mockResolvedValueOnce(serialize('hello'));
      redisClient.get.mockResolvedValueOnce(serialize('bye'));
      const localCache: Map<any, any> =
        testClassInstance.testFnWithRedis['memCache'];
      const dataSourceSpy = jest.spyOn(testClassInstance, 'dataSource');

      const result = await testClassInstance.testFnWithRedis('redis1');
      const result2 = await testClassInstance.testFnWithRedis('redis1');
      expect(redisClient.get).toHaveBeenCalledTimes(1);
      expect(localCache.has('redis1')).toEqual(true);
      await sleepMilliseconds(400);
      expect(localCache.has('redis1')).toEqual(false);
      const result3 = await testClassInstance.testFnWithRedis('redis1');
      expect(redisClient.get).toHaveBeenCalledTimes(2);
      expect(localCache.has('redis1')).toEqual(true);

      expect(result).toEqual('hello');
      expect(result2).toEqual('hello');
      expect(result3).toEqual('bye');
      expect(dataSourceSpy).not.toHaveBeenCalled();

      redisClient.get.mockReset();
    });
  });
});
