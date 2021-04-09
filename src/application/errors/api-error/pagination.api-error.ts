import { BaseApiError } from './base.api-error';

type Code =
  | 'BOTH_DIRECTIONS'
  | 'MISSING_LIMIT'
  | 'INVALID_ARGUMENT_COMBINATION';

export class PaginationArgumentsApiError extends BaseApiError {
  constructor(code: Code, message?: string) {
    super({
      message: message ?? 'Pagination arguments error',
      category: 'PAGINATION',
      code,
    });
  }
}
