import { ValidationError } from 'class-validator';
import { BaseApiError } from './base.api-error';

export class InputValidationApiError extends BaseApiError {
  constructor(errors: ValidationError[]) {
    super({
      category: 'INPUT_VALIDATION',
      code: 'INPUT_VALIDATION',
      message: 'Validation error',
      detail: errors,
    });
  }
}
