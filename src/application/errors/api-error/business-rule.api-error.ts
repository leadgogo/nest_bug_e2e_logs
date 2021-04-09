import { BaseApiError } from './base.api-error';

export class BusinessRuleApiError extends BaseApiError {
  constructor(
    code: string,
    message = 'Business rule violation',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    detail?: any
  ) {
    super({
      category: 'BUSINESS_RULE',
      code,
      message,
      detail,
    });
  }
}
