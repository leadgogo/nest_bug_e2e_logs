import { isDefined } from '@leadgogo/backend-utils';
import { PaginationArgumentsApiError } from '../../../errors/api-error/pagination.api-error';
import { PaginationArgs } from './pagination.args';

const defaultFirstAmount = 200;

export function paginationArgsValidator(value: PaginationArgs) {
  const { last, before, after } = value;
  let { first } = value;
  if (!isDefined(first) && !isDefined(last)) {
    first = defaultFirstAmount;
  }
  if (isDefined(first) && isDefined(last)) {
    throw new PaginationArgumentsApiError('BOTH_DIRECTIONS');
  }
  if (
    (isDefined(first) && isDefined(before)) ||
    (isDefined(last) && isDefined(after))
  ) {
    throw new PaginationArgumentsApiError('INVALID_ARGUMENT_COMBINATION');
  }
  return { ...value, first };
}
