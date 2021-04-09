import { Institution } from '../../../../domain/institution/institution.entity';
import { InstitutionService } from '../../../../domain/institution/institution.service';
import { User } from '../../../../domain/user/user.entity';
import { findAncestors } from '../../../../utils/nested-set';
import { MissingPermissionsApiError } from '../../../errors/api-error/auth/missing-permissions.api-error';
import {
  PermissionsEntry,
  PermissionTreeService,
} from './permission-tree.service';

export class PermissionsService {
  constructor(
    private permissionTreeService: PermissionTreeService,
    private institutionService: InstitutionService
  ) {}

  private async getPermissionEntries(user: User) {
    return this.permissionTreeService.getPermissionEntriesForUser(user);
  }

  private _getPermissionsForInstitution(
    institution: Institution,
    permissionsEntries: PermissionsEntry[]
  ) {
    const institutionPermissionEntries = findAncestors(
      institution,
      permissionsEntries
    );
    if (institutionPermissionEntries.length === 0) {
      throw new Error('User does not have access to institution.');
    }
    const permissions = Array.from(
      new Set(institutionPermissionEntries.map((a) => a.permissions).flat())
    ).sort((a, b) => a.localeCompare(b));
    return permissions;
  }

  async getPermissionsForInstitution(user: User, institutionId: number) {
    const institution = await this.institutionService.findById(institutionId);
    const permissionsEntries = await this.getPermissionEntries(user);
    const permissions = this._getPermissionsForInstitution(
      institution,
      permissionsEntries
    );
    return permissions;
  }

  async requirePermissionsForInstitution(
    user: User,
    institutionId: number,
    requiredPermissions: string[]
  ) {
    const availablePermissions = await this.getPermissionsForInstitution(
      user,
      institutionId
    );
    const allowed = requiredPermissions.some((p) =>
      availablePermissions.includes(p)
    );
    if (!allowed) {
      throw new MissingPermissionsApiError(requiredPermissions);
    }
  }
}
