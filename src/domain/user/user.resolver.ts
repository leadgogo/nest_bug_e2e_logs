import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Loader } from 'src/application/graphql/decorators/loader.decorator';
import { RequestedScalarFields } from 'src/application/graphql/decorators/requested-fields.decorator';
import { Role } from '../role/role.entity';
import { RoleService } from '../role/role.service';
import { User } from './user.entity';

@Resolver(User)
export class UserResolver {
  constructor(private roleService: RoleService) {}

  @ResolveField(() => Role)
  async role(
    @Parent() user: User,
    @RequestedScalarFields() fields: string[],
    @Loader() loader: Loader<number, Role>
  ) {
    const role = await loader(user.id, async (ids) => {
      return this.roleService.getMainRoleForUsers(ids, fields);
    });
    return role;
  }
}
