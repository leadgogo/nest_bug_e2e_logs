import { cursorToPayload, payloadToCursor } from '@leadgogo/backend-utils';
import { OrderByConfig } from '../../types/order-by-config.interface';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CursorPayload = Record<string, any>;

export type Direction = 'forward' | 'backward';

export interface PaginationConfiguration {
  offsetCursor: string | undefined;
  direction: Direction;
  limit: number;
  totalCountRequested: boolean;
}

export interface Page<T> {
  totalCount?: number;
  items: {
    cursor: string;
    item: T;
  }[];
  pages: {
    hasPrevious: boolean;
    hasNext: boolean;
  };
}

export abstract class BasePaginator<T> {
  protected configuration: PaginationConfiguration;
  protected implicitOrderBy: OrderByConfig | undefined;

  constructor({
    paginationConfiguration,
    implicitOrderBy,
  }: {
    paginationConfiguration: PaginationConfiguration;
    implicitOrderBy?: OrderByConfig;
  }) {
    this.configuration = paginationConfiguration;
    this.implicitOrderBy = implicitOrderBy;
  }

  decodeCursor(cursor: string): CursorPayload {
    return cursorToPayload<CursorPayload>(cursor);
  }

  encodeCursor(payload: CursorPayload) {
    return payloadToCursor(payload);
  }

  abstract getPage(): Promise<Page<T>>;
}
