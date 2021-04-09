import { PaginationArgs } from '../pagination-args/pagination.args';

export interface ListArgs extends PaginationArgs {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  where?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orderBy?: any;
}
