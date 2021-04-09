import { GraphQLError } from 'graphql';
import { BaseApiError } from '../../errors/api-error/base.api-error';

export function formatErrorHelper(error: GraphQLError) {
  const { originalError } = error;
  if (originalError instanceof BaseApiError) {
    const { code, category, detail } = originalError;
    Object.assign(error.extensions, {
      code,
      category,
      detail,
    });
  }
  delete error.extensions?.exception;
  return error;
}
