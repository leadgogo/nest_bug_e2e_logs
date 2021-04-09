import { MetadataStorage } from '@mikro-orm/core';
import { EntityManager, QueryBuilder } from '@mikro-orm/mysql';
import { isDefined } from '@leadgogo/backend-utils';

export function fieldToColumn(qb: QueryBuilder, fieldName: string) {
  const metadata: MetadataStorage = qb['metadata'];
  const parts = fieldName.split('.').reverse() as [string, string | undefined];
  const [property] = parts;
  let [, alias] = parts;
  let entityName: string;
  if (!isDefined(alias)) {
    alias = qb['alias'];
    entityName = qb['entityName'];
  } else {
    entityName = qb['_aliasMap'][alias];
  }
  const columnName = metadata.get(entityName).properties[property]
    .fieldNames[0];
  return `\`${alias}\`.\`${columnName}\``;
}

export async function getCountForQb(qb: QueryBuilder) {
  const em: EntityManager = qb['em'];
  const countQuery = qb
    .getKnexQuery()
    .clone()
    .clearSelect()
    .clearOrder()
    .count<{ c: number }>('* as c');

  const { c: totalCount } = await em.execute<{ c: number }>(
    countQuery.first(),
    undefined,
    'get'
  );

  return totalCount;
}

export function getPrimaryKeyForEntity(
  em: EntityManager,
  entityName: string
): string {
  const { primaryKeys } = em.getMetadata().get(entityName);
  if (primaryKeys.length > 1) {
    throw new Error(
      `Could not get single primary key for entity ${entityName}. Found ${primaryKeys.join()}.`
    );
  }
  return primaryKeys[0];
}
