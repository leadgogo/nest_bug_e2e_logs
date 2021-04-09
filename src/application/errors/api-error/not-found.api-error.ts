import { BaseApiError } from './base.api-error';

export class NotFoundApiError extends BaseApiError {
  constructor(message = 'Not found') {
    super({
      code: 'NOT_FOUND',
      message,
    });
  }
}
