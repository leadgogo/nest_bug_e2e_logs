import { Injectable } from '@nestjs/common';
import { cached } from '../../utils/decorators/cached';
import { UserRepository } from './user.repository';
import { User } from './user.entity';
import { EntityManager } from '@mikro-orm/mysql';

@Injectable()
export class UserService {
  constructor(
    private em: EntityManager,
    private userRepository: UserRepository
  ) {}

  @cached({
    redisTtl: 10_000,
    redisPostProcess(deserialized) {
      const user: User = (this.em as EntityManager).map(User, deserialized);
      return user;
    },
  })
  async findById(id: number) {
    const user = await this.userRepository.findOneOrFail({ id });
    return user;
  }
}
