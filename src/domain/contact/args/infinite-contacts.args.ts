import { ArgsType } from '@nestjs/graphql';
import { ListArgs } from 'src/application/graphql/lists/list-args/list-args.interface';
import { PaginationArgs } from 'src/application/graphql/lists/pagination-args/pagination.args';
// import { QueryContactsWhereInput } from '../inputs/query-contacts-where.input';

@ArgsType()
export class InfiniteContactsArgs extends PaginationArgs implements ListArgs {}
