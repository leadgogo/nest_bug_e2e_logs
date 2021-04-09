import { Injectable } from '@nestjs/common';
import { Institution } from '../../../../domain/institution/institution.entity';
import { Role } from '../../../../domain/role/role.entity';
import { RoleService } from '../../../../domain/role/role.service';
import { User } from '../../../../domain/user/user.entity';
import { cached } from '../../../../utils/decorators/cached';

export interface PermissionsEntry {
  institutionId: number;
  lft: number;
  rgt: number;
  level: number;
  permissions: string[];
}

@Injectable()
export class PermissionTreeService {
  constructor(private roleService: RoleService) {}

  private async getPermissionsForRoles(
    roleIds: string[]
  ): Promise<Record<string, string[]>> {
    const rolePermissions: Record<string, string[]> = Object.fromEntries(
      await Promise.all(
        roleIds.map(
          async (roleId): Promise<[string, string[]]> => {
            const permissions = await this.roleService.getPermissionsForRole(
              roleId
            );
            return [roleId, permissions];
          }
        )
      )
    );
    return rolePermissions;
  }

  private getPermissionsEntry(
    institution: Institution,
    role: Role,
    rolePermissions: Record<string, string[]>
  ): PermissionsEntry {
    return {
      institutionId: institution.id,
      lft: institution.lft,
      rgt: institution.rgt,
      level: institution.level,
      permissions: rolePermissions[role.id],
    };
  }

  @cached({
    cacheKey: (user: User) => user.id,
    redisTtl: Infinity,
    redisPrefix: 'permissions:user',
  })
  async getPermissionEntriesForUser(user: User) {
    await user.institutionRoles.init({ populate: ['role', 'institution'] });
    const institutionRoleRows = user.institutionRoles.getItems();
    const roleIds = institutionRoleRows.map(({ role }) => role.id);
    const rolePermissions = await this.getPermissionsForRoles(roleIds);
    const permissionsEntries = institutionRoleRows.map(
      ({ institution, role }) =>
        this.getPermissionsEntry(institution, role, rolePermissions)
    );
    return permissionsEntries;
  }
}
