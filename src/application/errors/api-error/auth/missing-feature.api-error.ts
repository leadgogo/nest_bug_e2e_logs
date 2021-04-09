import { AuthorizationApiError } from './authorization.api-error';

export class MissingFeatureApiError extends AuthorizationApiError {
  constructor(featureName: string, message?: string) {
    super('MISSING_FEATURE', message ?? 'Missing feature', { featureName });
  }
}
