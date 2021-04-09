import { EntityRepository, QueryBuilder } from '@mikro-orm/mysql';
import { virtualProperties } from './depends-on.decorator';

type AugmentedQueryBuilder<TEntity> = QueryBuilder<TEntity>;

type Fields = Parameters<QueryBuilder['select']>[0];

export function virtualToReal(entityName: string | Function, fields: Fields) {
  const name = typeof entityName === 'function' ? entityName.name : entityName;
  fields = Array.isArray(fields) ? fields : [fields];
  return fields
    .map((field) => {
      const found = virtualProperties.get(name)?.get(field as string);
      return found ?? field;
    })
    .flat() as string[];
}

export class BaseRepository<TEntity> extends EntityRepository<TEntity> {
  createAugmentedQueryBuilder(options?: {
    fields?: string[];
    alias?: string;
  }): AugmentedQueryBuilder<TEntity> {
    const entityName = this.entityName as string;
    const { primaryKeys, properties } = this.em.getMetadata().get(entityName);
    const foreignKeys = Object.entries(properties)
      .map(([, config]) => config)
      .filter((config) => ['1:1', 'm:1'].includes(config.reference))
      .flatMap((config) => config.fieldNames);
    const requiredFields = Array.from(
      new Set([...primaryKeys, ...foreignKeys, ...(options?.fields ?? [])])
    );
    const qb = super.createQueryBuilder(options?.alias);
    const originalSelect = qb.select.bind(qb);
    function getUniqueFields(fields: string[]) {
      return Array.from(new Set(fields));
    }
    qb.select = function (fields: Fields, distinct?: boolean) {
      const realFields = virtualToReal(entityName, fields);
      return originalSelect(
        getUniqueFields(realFields.concat(requiredFields)),
        distinct
      );
    };
    qb.select(requiredFields);
    qb.addSelect = function (fields: string | string[]) {
      const uniqueFields = getUniqueFields(
        [...(this['_fields'] as string[])].concat(fields)
      );
      this['_fields'] = virtualToReal(entityName, uniqueFields);
      return this;
    };
    return qb;
  }

  createQueryBuilder(alias?: string): QueryBuilder<TEntity> {
    return this.createAugmentedQueryBuilder({ alias });
  }
}
