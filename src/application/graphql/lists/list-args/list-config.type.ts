import { PaginationConfiguration } from 'src/application/pagination/base.paginator';
import { QueryConfiguration } from 'src/types/query-config.interface';

export interface ListConfig {
  queryConfig: QueryConfiguration;
  paginationConfig: PaginationConfiguration;
}
