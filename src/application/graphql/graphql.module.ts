import path from 'path';
import {
  Module,
  NestModule,
  MiddlewareConsumer,
  Global,
  OnModuleInit,
} from '@nestjs/common';
import { GraphQLModule as NestGraphQLModule } from '@nestjs/graphql';
import readPkgUp from 'read-pkg-up';
import { formatErrorHelper } from './helpers/format-error.helper';
import { StringWhereInput } from './inputs/string-where.input';
import { InjectOrmEntityManagerMiddleware } from './middleware/inject-orm-entity-manager.middleware';
import { LoaderPlugin } from './plugins/loader.plugin';
import { assertIsDefined } from '@leadgogo/backend-utils';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LocaleInterceptor } from 'src/application/graphql/interceptors/locale.interceptor';
import { RequireLocaleMiddleware } from 'src/application/graphql/middleware/require-locale.middleware';
import { SqlTransactionForMutations } from 'src/application/graphql/plugins/sql-transaction-for-mutations.plugin';
import { NumberWhereInput } from 'src/application/graphql/inputs/number-where.input';
import { OrmFlushInterceptor } from 'src/application/graphql/interceptors/orm-flush.interceptor';
import { InjectDomainEventDispatcherMiddleware } from 'src/application/graphql/middleware/inject-domain-event-dispatcher.middleware';

@Global()
@Module({
  imports: [
    NestGraphQLModule.forRootAsync({
      useFactory: async () => {
        const pkg = await readPkgUp();
        assertIsDefined(pkg);
        const target = path.join(
          path.dirname(pkg.path),
          'src/application/graphql/schema.gql'
        );
        return {
          useGlobalPrefix: true,
          autoSchemaFile: target,
          sortSchema: true,
          debug: false,
          // tracing: true,
          formatError: formatErrorHelper,
          fieldResolverEnhancers: ['guards'],
        };
      },
    }),
  ],
  providers: [
    SqlTransactionForMutations,
    LoaderPlugin,
    StringWhereInput,
    NumberWhereInput,
    {
      provide: APP_INTERCEPTOR,
      useClass: LocaleInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: OrmFlushInterceptor,
    },
  ],
})
export class GraphqlModule implements NestModule, OnModuleInit {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(
        InjectOrmEntityManagerMiddleware,
        InjectDomainEventDispatcherMiddleware,
        RequireLocaleMiddleware
      )
      .forRoutes('/graphql*');
  }

  onModuleInit() {
    // for (const { target, value } of TypeMetadataStorage['classExtensions']) {
    //   if (Array.isArray(value.permissions) && value.permissions.length > 0) {
    //     const resolver = TypeMetadataStorage['resolvers'].find(
    //       (r: any) => !r.isAbstract && r.typeFn() === target,
    //     );
    //     if (!resolver) {
    //       throw new Error(
    //         `Object type [${target.name}] has required permissions, but no resolver for it was found.`,
    //       );
    //     }
    //   }
    // }
    // for (const { target, fieldName, value } of TypeMetadataStorage[
    //   'fieldExtensions'
    // ]) {
    //   if (Array.isArray(value.permissions) && value.permissions.length > 0) {
    //     const field = TypeMetadataStorage['fields'].find((f: any) => {
    //       return f.target === target && f.name === fieldName;
    //     });
    //     const { schemaName } = field;
    //     const objectResolver = TypeMetadataStorage['resolvers'].find(
    //       (r: any) => !r.isAbstract && r.typeFn() === target,
    //     );
    //     if (!objectResolver) {
    //       throw new Error(
    //         `Field [${schemaName}] on object type [${target.name}] has required permissions, but no resolver for [${target.name}] was found.`,
    //       );
    //     }
    //     const fieldResolver = TypeMetadataStorage['fieldResolvers'].find(
    //       (fr: any) => {
    //         return (
    //           fr.classMetadata?.typeFn() === target &&
    //           fr.schemaName === schemaName
    //         );
    //       },
    //     );
    //     if (!fieldResolver) {
    //       throw new Error(
    //         `Field [${schemaName}] on object type [${target.name}] has required permissions, but no field resolver for it was found on [${objectResolver.target.name}].`,
    //       );
    //     }
    //   }
    // }
  }
}
