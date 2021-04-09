import { EntityManager } from '@mikro-orm/mysql';
import { Injectable } from '@nestjs/common';
import { cached } from '../../utils/decorators/cached';
import { Role } from './role.entity';
import { RoleRepository } from './role.repository';

@Injectable()
export class RoleService {
  constructor(
    private em: EntityManager,
    private roleRepository: RoleRepository
  ) {}

  @cached({ redisTtl: Infinity, redisPrefix: 'permissions:role' })
  async getPermissionsForRole(id: string): Promise<string[]> {
    return this.roleRepository.getPermissionsForRole(id);
  }

  async getMainRoleForUsers(userIds: number[], fields: string[]) {
    const qb = this.roleRepository.createAugmentedQueryBuilder({ alias: 'r' });
    const kqb = qb
      .select([...fields, 'u.id as userId'])
      .join('institutionRoles', 'ir')
      .join('ir.user', 'u')
      .where({
        'u.id': userIds,
        'u.institution': qb.ref('ir.institution_id'),
      })
      .getKnexQuery();
    const rows: (Role & { userId: number })[] = await this.em.execute(kqb);
    const map = Object.fromEntries<string, Role>(
      rows.map((row) => {
        const { userId, ...rest } = row;
        const role = this.em.map(Role, rest);
        return [userId.toString(), role];
      })
    );
    return map;
  }
}
