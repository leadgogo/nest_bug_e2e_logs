import { Injectable } from '@nestjs/common';
import { EntityManager, QueryBuilder } from '@mikro-orm/mysql';
import { isDefined } from '@leadgogo/backend-utils';
import { OrderByConfig } from '../../types/order-by-config.interface';
import {
  BasePaginator,
  Direction,
  CursorPayload,
  Page,
  PaginationConfiguration,
} from '../../application/pagination/base.paginator';
import { fieldToColumn, getCountForQb } from './orm-helpers';

@Injectable()
export class DatabasePaginator<T> extends BasePaginator<T> {
  private qb: QueryBuilder<T>;

  constructor({
    paginationConfiguration,
    qb,
    implicitOrderBy,
  }: {
    paginationConfiguration: PaginationConfiguration;
    qb: QueryBuilder<T>;
    implicitOrderBy?: OrderByConfig;
  }) {
    super({ paginationConfiguration, implicitOrderBy });
    this.qb = qb;
  }

  private addCursorConditionsToQb(
    qb: QueryBuilder,
    cursor: string,
    direction: Direction
  ) {
    const cursorPayload = this.decodeCursor(cursor);
    const cursorKeys = Object.keys(cursorPayload);
    const operator = (direction === 'forward' ? '>' : '<') + '=';
    qb.andWhere(
      `(${cursorKeys
        .map((key) => fieldToColumn(qb, key))
        .join(', ')}) ${operator} (${cursorKeys.map((_) => '?').join(', ')})`,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      cursorKeys.map((key) => cursorPayload[key])
    );
  }

  private isOffsetElementPresent(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resultSet: any[],
    offsetCursor: string | undefined
  ) {
    if (isDefined(offsetCursor)) {
      const firstElement = resultSet[0];
      if (firstElement) {
        const cursorPayload = this.decodeCursor(offsetCursor);
        return Object.keys(cursorPayload).every(
          (key) => firstElement[key] === cursorPayload[key]
        );
      }
    }
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private makeCursor(orderByKeys: string[], row: any) {
    const cursorPayload: CursorPayload = Object.fromEntries(
      orderByKeys.map((key) => [key, row[key]])
    );
    const cursor = this.encodeCursor(cursorPayload);
    return cursor;
  }

  private updatedOrderBy(direction: Direction) {
    const originalOrderBy = this.qb['_orderBy'];
    if (this.implicitOrderBy) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.qb.orderBy(this.implicitOrderBy as any);
      const mergedOrderBy = Object.assign(originalOrderBy, this.qb['_orderBy']);
      this.qb.orderBy(mergedOrderBy);
    }
    if (direction === 'backward') {
      for (const key of Object.keys(this.qb['_orderBy'])) {
        this.qb['_orderBy'][key] =
          this.qb['_orderBy'][key] === 'asc' ? 'desc' : 'asc';
      }
    }
  }

  async getPage() {
    const {
      offsetCursor,
      direction,
      limit,
      totalCountRequested,
    } = this.configuration;

    const totalCount: number | undefined = totalCountRequested
      ? await getCountForQb(this.qb)
      : undefined;

    this.updatedOrderBy(direction);

    if (isDefined(offsetCursor)) {
      this.addCursorConditionsToQb(this.qb, offsetCursor, direction);
    }
    this.qb.limit(limit + (isDefined(offsetCursor) ? 2 : 1));

    // select fields from order by since these values will be used in our cursor
    const orderByFields = Object.keys(this.qb['_orderBy']);
    for (const fieldName of orderByFields) {
      this.qb.addSelect(
        `${fieldToColumn(this.qb, fieldName)} as "${fieldName}"`
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let resultSet: any[] = await this.qb.execute('all', false);

    const foundOffsetElement = this.isOffsetElementPresent(
      resultSet,
      offsetCursor
    );
    if (foundOffsetElement) {
      resultSet = resultSet.slice(1);
    }
    const foundMoreThanLimit = resultSet.length > limit;
    if (foundMoreThanLimit) {
      resultSet = resultSet.slice(0, -(resultSet.length - limit));
    }

    if (direction === 'backward') {
      resultSet.reverse();
    }

    const em: EntityManager = this.qb['em'];

    const items = resultSet.map((row) => {
      const cursor = this.makeCursor(orderByFields, row);
      const item = em.map<T>(this.qb['entityName'], row);
      return {
        cursor,
        item,
      };
    });

    let hasNextPage = false;
    let hasPreviousPage = false;
    if (direction === 'forward') {
      if (foundOffsetElement) {
        hasPreviousPage = true;
      }
      if (foundMoreThanLimit) {
        hasNextPage = true;
      }
    } else {
      if (foundOffsetElement) {
        hasNextPage = true;
      }
      if (foundMoreThanLimit) {
        hasPreviousPage = true;
      }
    }

    const result: Page<T> = {
      totalCount,
      items,
      pages: {
        hasPrevious: hasPreviousPage,
        hasNext: hasNextPage,
      },
    };

    return result;
  }
}
