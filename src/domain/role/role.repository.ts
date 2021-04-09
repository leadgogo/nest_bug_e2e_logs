import { Repository } from '@mikro-orm/core';
import { BaseRepository } from '../../infrastructure/database/base.repository';
import { Role } from './role.entity';

@Repository(Role)
export class RoleRepository extends BaseRepository<Role> {
  async getPermissionsForRole(id: string): Promise<string[]> {
    const result: {
      permission: string;
    }[] = await this.em.getConnection().execute(
      `
      select distinct pr.permission_id permission
      from
        role r
        left join role sr on
          r.lft <= sr.lft
          and r.rgt >= sr.rgt
        left join permission_rule pr on sr.id = pr.role_id
      where r.id = ?
      order by pr.permission_id;
    `,
      [id]
    );
    const permissions = result.map((row) => row.permission);
    return permissions;
  }
}
