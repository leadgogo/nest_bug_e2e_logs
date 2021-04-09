/* eslint @typescript-eslint/no-explicit-any: off */
/* eslint @typescript-eslint/restrict-template-expressions: off */
import { Injectable } from '@nestjs/common';
import { MetadataStorage, QBFilterQuery } from '@mikro-orm/core';
import { EntityManager, QueryBuilder } from '@mikro-orm/mysql';
import EnumUtils from 'enum-utils';
import { QueryConfiguration } from '../../types/query-config.interface';
import { getPrimaryKeyForEntity } from './orm-helpers';
import { LogicalOperator } from '../../application/graphql/enums/logical-operator.enum';
import { ListOperator } from '../../application/graphql/enums/list-operator.enum';

export interface JoinConfig {
  field: string;
  alias: string;
  cond?: QBFilterQuery;
  type?: 'leftJoin' | 'innerJoin' | 'pivotJoin';
  path?: string;
}

@Injectable()
export class DatabaseQueryConfigApplier<T = any> {
  constructor(private em: EntityManager) {}

  private transformCondition(operator: string, operand?: any): [string, any] {
    if (operator === '_contains') {
      return ['$like', `%${operand}%`];
    }
    return [operator.replace(/^_/, '$'), operand];
  }

  private walkFields(
    queryBuilder: QueryBuilder<T>,
    currentEntityName: string,
    relationFieldName: string | { alias: string } | null,
    whereOrOrderByInput: Record<string, any> | Record<string, any>[],
    joinConfigs: JoinConfig[],
    handleScalar: (fieldNameWithAlias: string, fieldObj: any) => void,
    handleUnknownField?: (
      entityName: string,
      relationFieldName: string | { alias: string } | null,
      fieldName: string,
      fieldObj: any
    ) => boolean
  ): void {
    const metadata: MetadataStorage = queryBuilder['metadata'];
    const items = Array.isArray(whereOrOrderByInput)
      ? whereOrOrderByInput
      : [whereOrOrderByInput];
    for (const item of items) {
      for (const [fieldName, fieldObj] of Object.entries(item)) {
        const fieldMetadata = metadata.get(currentEntityName).properties[
          fieldName
        ];
        if (!fieldMetadata) {
          if (
            !handleUnknownField ||
            handleUnknownField(
              currentEntityName,
              relationFieldName,
              fieldName,
              fieldObj
            ) === false
          ) {
            throw new Error(
              `${fieldName} field not found in ${currentEntityName} entity`
            );
          }
        } else {
          if (fieldMetadata.reference === 'scalar') {
            const alias =
              typeof relationFieldName === 'object' &&
              relationFieldName !== null
                ? relationFieldName.alias
                : joinConfigs.find((jc) => jc.field === relationFieldName)
                    ?.alias;
            handleScalar(`${alias ? `${alias}.` : ''}${fieldName}`, fieldObj);
          } else {
            if (fieldMetadata.reference !== '1:m') {
              if (!joinConfigs.some((jc) => jc.field === fieldName)) {
                const existingAlias = Object.entries(queryBuilder['_aliasMap'])
                  .map(([alias, type]) => ({ alias, type }))
                  .find(({ type }) => type === fieldMetadata.type)?.alias;
                joinConfigs.push({
                  field: fieldName,
                  alias: existingAlias ?? queryBuilder.getNextAlias(),
                });
              }
            }
            const { type: nextEntityName } = fieldMetadata;
            this.walkFields(
              queryBuilder,
              nextEntityName,
              fieldName,
              fieldObj,
              joinConfigs,
              handleScalar,
              handleUnknownField
            );
          }
        }
      }
    }
  }

  private handleObjectLogicalOperators(
    queryBuilder: QueryBuilder<T>,
    joinConfigs: JoinConfig[],
    conditionsArray: any[],

    entityName: string,
    operator: LogicalOperator,
    fieldWhereInput: any,

    relationFieldName?: string | { alias: string } | null
  ) {
    if ([LogicalOperator.AND, LogicalOperator.OR].includes(operator)) {
      if (!Array.isArray(fieldWhereInput)) {
        throw new Error(
          'For _and and _or operators, the operands must be arrays.'
        );
      }
      const [finalOperator] = this.transformCondition(operator);
      const nestedWhereObj = this.generateWhereObject(
        queryBuilder,
        entityName,
        fieldWhereInput,
        joinConfigs,
        { [finalOperator]: [] },
        relationFieldName
      );
      conditionsArray.push(nestedWhereObj);
    } else {
      if (Array.isArray(fieldWhereInput)) {
        throw new Error('For _not operator, the operand cannot be an array.');
      }
      const nestedWhereObj = this.generateWhereObject(
        queryBuilder,
        entityName,
        fieldWhereInput,
        joinConfigs,
        { $not: [] },
        relationFieldName
      );
      conditionsArray.push({ $not: nestedWhereObj.$not[0] });
    }
    return true;
  }

  private handleListOperators(
    queryBuilder: QueryBuilder<T>,
    joinConfigs: JoinConfig[],
    conditionsArray: any[],

    parentEntityName: string,
    entityName: string,
    operator: ListOperator,
    fieldWhereInput: any,

    relationFieldName: string
  ) {
    const subQueryBuilder = this.em
      .createQueryBuilder<T>(parentEntityName)
      .select(getPrimaryKeyForEntity(this.em, parentEntityName));

    const subQueryWhereObj = this.generateWhereObject(
      subQueryBuilder,
      entityName,
      fieldWhereInput,
      [],
      { $and: [] },
      { alias: 'r' }
    );
    if (
      [ListOperator.ALL, ListOperator.EVERY, ListOperator.NONE].includes(
        operator
      )
    ) {
      subQueryBuilder.leftJoin(relationFieldName, 'r');
      const mainCondition =
        operator === ListOperator.NONE
          ? subQueryWhereObj
          : { $not: subQueryWhereObj };
      subQueryBuilder.where({
        $or: [
          mainCondition,
          { [`r.${getPrimaryKeyForEntity(this.em, entityName)}`]: null },
        ],
      });
      conditionsArray.push({
        id: {
          $nin: subQueryBuilder.getKnexQuery(),
        },
      });
    } else {
      subQueryBuilder.join(relationFieldName, 'r').where(subQueryWhereObj);
      conditionsArray.push({
        id: {
          $in: subQueryBuilder.getKnexQuery(),
        },
      });
    }
    return true;
  }

  private generateWhereObject(
    queryBuilder: QueryBuilder<T>,
    currentEntityName: string,
    whereInput: Record<string, any> | Record<string, any>[],
    joinConfigs: JoinConfig[],
    whereObj: Record<string, any[]> = { $and: [] },
    relationFieldName?: string | { alias: string } | null
  ): Record<string, any[]> {
    const conditionsArray = Object.values(whereObj)[0];
    this.walkFields(
      queryBuilder,
      currentEntityName,
      relationFieldName ?? null,
      whereInput,
      joinConfigs,
      (fieldNameWithAlias, conditionsInput) => {
        const conditions: Record<string, any> = {};
        for (const [operator, operand] of Object.entries(conditionsInput)) {
          const [finalOperator, finalOperand] = this.transformCondition(
            operator,
            operand
          );
          conditions[finalOperator] = finalOperand;
        }
        const entry = { [fieldNameWithAlias]: conditions };
        conditionsArray.push(entry);
      },
      (entityName, relationFieldName, fieldName, fieldObj) => {
        if (EnumUtils.values(LogicalOperator).includes(fieldName as any)) {
          return this.handleObjectLogicalOperators(
            queryBuilder,
            joinConfigs,
            conditionsArray,
            entityName,
            fieldName as LogicalOperator,
            fieldObj,
            relationFieldName
          );
        } else if (EnumUtils.values(ListOperator).includes(fieldName as any)) {
          if (typeof relationFieldName !== 'string') {
            throw new Error(`Invalid relationFieldName: ${relationFieldName}.`);
          }
          return this.handleListOperators(
            queryBuilder,
            joinConfigs,
            conditionsArray,
            currentEntityName,
            entityName,
            fieldName as ListOperator,
            fieldObj,
            relationFieldName
          );
        }
        return false;
      }
    );
    return whereObj;
  }

  private generateOrderByObject(
    queryBuilder: QueryBuilder<T>,
    currentEntityName: string,
    orderByInput: Record<string, any>,
    joinConfigs: JoinConfig[]
  ) {
    const orderByObj: Record<string, any> = {};
    this.walkFields(
      queryBuilder,
      currentEntityName,
      null,
      orderByInput,
      joinConfigs,
      (fieldNameWithAlias, order) => {
        orderByObj[fieldNameWithAlias] = order;
      }
    );
    return orderByObj;
  }

  apply(qb: QueryBuilder<T>, queryConfig: QueryConfiguration): void {
    const { fields, where, orderBy } = queryConfig;

    qb.addSelect(fields);
    const entityName: string = qb['entityName'];
    const joinConfigs: JoinConfig[] = [];
    if (where) {
      const whereObj = this.generateWhereObject(
        qb,
        entityName,
        where,
        joinConfigs
      );
      qb.where(whereObj);
    }
    if (orderBy) {
      const orderByObj = this.generateOrderByObject(
        qb,
        entityName,
        orderBy,
        joinConfigs
      );
      qb.orderBy(orderByObj);
    }
    for (const joinConfig of joinConfigs) {
      const { field, alias, cond, type, path } = joinConfig;
      qb.join(field, alias, cond, type, path);
    }
  }
}
