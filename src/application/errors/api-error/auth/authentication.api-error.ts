import { BaseApiError } from '../base.api-error';

export abstract class AuthenticationApiError extends BaseApiError {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(code: string, message?: string, detail?: any) {
    super({
      category: 'AUTHENTICATION',
      code,
      message,
      detail,
    });
  }
}
