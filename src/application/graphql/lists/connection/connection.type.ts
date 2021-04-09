import { Type } from '@nestjs/common';
import { ObjectType, Field, Int } from '@nestjs/graphql';

export interface Edge<TEntity> {
  cursor: string;
  node: TEntity;
}

@ObjectType()
export class PageInfo {
  @Field()
  startCursor: string;

  @Field()
  endCursor: string;

  @Field()
  hasPreviousPage: boolean;

  @Field()
  hasNextPage: boolean;
}

export interface Connection<TEntity> {
  totalCount?: number;
  edges?: Edge<TEntity>[];
  nodes?: TEntity[];
  pageInfo?: PageInfo;
}

export function Connection<T>(classRef: Type<T>): new () => Connection<T> {
  @ObjectType(`${classRef.name}Edge`)
  abstract class EdgeType implements Edge<T> {
    @Field()
    cursor: string;

    @Field(() => classRef)
    node: T;
  }

  const cls = class {};
  Field(() => Int, { nullable: true })(cls.prototype, 'totalCount');
  Field(() => [EdgeType], { nullable: true })(cls.prototype, 'edges');
  Field(() => [classRef], { nullable: true })(cls.prototype, 'nodes');
  Field(() => PageInfo, { nullable: true })(cls.prototype, 'pageInfo');

  ObjectType({ isAbstract: true })(cls);

  return cls;
}
