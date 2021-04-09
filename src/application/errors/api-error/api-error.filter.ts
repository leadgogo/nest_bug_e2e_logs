import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseApiError } from './base.api-error';
import { GqlExceptionFilter } from '@nestjs/graphql';

@Catch(BaseApiError)
export class ApiErrorFilter implements GqlExceptionFilter {
  catch(exception: BaseApiError, host: ArgumentsHost) {
    return exception;
  }
}
