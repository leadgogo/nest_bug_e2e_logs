import crypto from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthenticationService } from '@leadgogo/backend-utils';
import { User } from '../../domain/user/user.entity';
import { UserRepository } from '../../domain/user/user.repository';
import { UserService } from '../../domain/user/user.service';
import { Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class SessionService {
  private _currentUser: User | null = null;

  constructor(
    private configService: ConfigService,
    private authenticationService: AuthenticationService,
    private userRepository: UserRepository,
    private userService: UserService
  ) {}

  private verifyPassword(
    passwordSalt: string,
    passwordHash: string,
    providedPassword: string
  ): void {
    const globalSalt = this.configService.get('authenticationSalt') as string;
    const currentHash = crypto
      .createHash('sha1')
      .update(globalSalt + providedPassword + passwordSalt)
      .digest('hex');
    if (!(currentHash && currentHash === passwordHash)) {
      throw new UnauthorizedException('Wrong credentials.');
    }
  }

  async login(username: string, password: string): Promise<string> {
    const user = await this.userRepository
      .createQueryBuilder('u')
      .select(['id', 'passwordHash', 'passwordSalt', 'firstName', 'lastName'])
      .joinAndSelect('u.institution', 'i')
      .where({ username, active: true })
      .getSingleResult();
    if (!user) {
      throw new UnauthorizedException();
    }
    const { passwordSalt, passwordHash } = user;
    this.verifyPassword(passwordSalt, passwordHash, password);
    const jwt = await this.authenticationService.createSession(
      {
        id: user.id,
        name: user.fullName,
      },
      {
        id: user.institution.id,
        name: user.institution.name,
        type: user.institution.type,
      }
    );
    return jwt;
  }

  async logout(): Promise<void> {
    await this.authenticationService.deleteSession();
  }

  async getCurrentUser(): Promise<User> {
    if (!this._currentUser) {
      this._currentUser = await this.userService.findById(
        this.authenticationService.currentUserId
      );
    }
    return this._currentUser;
  }
}
