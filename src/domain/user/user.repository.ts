import { Repository } from '@mikro-orm/core';
import { BaseRepository } from '../../infrastructure/database/base.repository';
import { User } from './user.entity';

@Repository(User)
export class UserRepository extends BaseRepository<User> {}
