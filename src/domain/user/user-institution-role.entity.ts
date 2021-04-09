import { ManyToOne, Entity } from '@mikro-orm/core';
import { User } from './user.entity';
import { Role } from '../role/role.entity';
import { Institution } from '../institution/institution.entity';

@Entity({ tableName: 'account_role' })
export class UserInstitutionRole {
  @ManyToOne({ primary: true, fieldName: 'account_id' })
  user: User;

  @ManyToOne({ primary: true })
  institution: Institution;

  @ManyToOne({ primary: true })
  role: Role;
}
