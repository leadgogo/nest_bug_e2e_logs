import { AuthorizationApiError } from './authorization.api-error';

export class MissingPermissionsApiError extends AuthorizationApiError {
  constructor(permissions: string[]) {
    super('MISSING_PERMISSIONS', 'Missing permissions', { permissions });
  }
}
