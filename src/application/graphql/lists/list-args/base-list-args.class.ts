import { Type } from '@nestjs/common';
import { ArgsType, Field } from '@nestjs/graphql';
import { getOrderByInputType } from 'src/application/graphql/lists/list-args/order-by-input/order-by-input';
import { PaginationArgs } from '../pagination-args/pagination.args';
import { getWhereInputType } from './where-input/where-input';

export interface ListQueryArgs {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  where?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orderBy?: any;
}

export interface BaseListArgs extends ListQueryArgs, PaginationArgs {}

export function BaseListArgs<T>(entityCls: Type<T>): new () => BaseListArgs {
  const baseClassName = `Base${entityCls.name}ListArgs`;
  const box = {
    [baseClassName]: class extends PaginationArgs {},
  };
  const baseCls = box[baseClassName];

  const whereCls = getWhereInputType(entityCls);
  Field(() => whereCls, { nullable: true })(baseCls.prototype, 'where');

  const orderByCls = getOrderByInputType(entityCls);
  if (orderByCls) {
    Field(() => orderByCls, { nullable: true })(baseCls.prototype, 'orderBy');
  }

  ArgsType()(baseCls);
  return baseCls;
}
