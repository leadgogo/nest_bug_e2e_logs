import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Configuration } from 'src/config/all.config';
import { SessionService } from './session.service';
import {
  PermissionTreeService,
  PermissionsEntry,
} from '../authorization/authorization-providers/permissions/permission-tree.service';
import { FeaturesService } from '../authorization/authorization-providers/features/features.service';
import { PermissionsService } from '../authorization/authorization-providers/permissions/permissions.service';
import { AuthenticationService, RedisService } from '@leadgogo/backend-utils';
import { RoleService } from '../../domain/role/role.service';
import { UserRepository } from '../../domain/user/user.repository';
import { UserService } from '../../domain/user/user.service';
import { RoleRepository } from '../../domain/role/role.repository';
import { InstitutionService } from '../../domain/institution/institution.service';
import { Institution } from '../../domain/institution/institution.entity';

describe('AuthService', () => {
  let configService: jest.Mocked<ConfigService<Configuration>>;
  let sessionService: SessionService;
  let permissionsService: PermissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: jest.fn(),
        },
        {
          provide: AuthenticationService,
          useValue: jest.fn(),
        },
        {
          provide: RoleService,
          useValue: jest.fn(),
        },
        {
          provide: PermissionTreeService,
          useValue: jest.fn(),
        },
        PermissionsService,
        {
          provide: FeaturesService,
          useValue: jest.fn(),
        },
        {
          provide: UserRepository,
          useValue: jest.fn(),
        },
        {
          provide: UserService,
          useValue: jest.fn(),
        },
        {
          provide: RoleRepository,
          useValue: jest.fn(),
        },
        {
          provide: InstitutionService,
          useValue: jest.fn(),
        },
        SessionService,
      ],
    }).compile();

    configService = module.get(ConfigService);
    sessionService = await module.resolve<SessionService>(SessionService);
    permissionsService = module.get<PermissionsService>(PermissionsService);
  });

  it('should be defined', () => {
    expect(sessionService).toBeDefined();
  });

  describe('verifyPassword', () => {
    it('should return successfully for a valid password', () => {
      const salt = '6001c173dfafd7b2b00966064b1f54ef5194b803';
      const hash = '20807d229b769eafc9add3b15c3dd3b2df8cf9b1';
      configService.get.mockReturnValue(
        '5aWEw#4f#5dS#35&8^5Q1@dDf#4RdSsfnVgf5#5390b90822'
      );
      expect(() =>
        sessionService['verifyPassword'](salt, hash, 'admin1234')
      ).not.toThrow();
    });

    it('should throw for an invalid password', () => {
      const salt = '6001c173dfafd7b2b00966064b1f54ef5194b803';
      const hash = '20807d229b769eafc9add3b15c3dd3b2df8cf9b1';
      configService.get.mockReturnValue(
        '5aWEw#4f#5dS#35&8^5Q1@dDf#4RdSsfnVgf5#5390b90822'
      );
      expect(() =>
        sessionService['verifyPassword'](salt, hash, 'hunter2')
      ).toThrow();
    });
  });

  describe('permissions', () => {
    describe('_getPermissionsForInstitution', () => {
      it('returns the correct permissions', () => {
        const institution: Partial<Institution> = {
          level: 8,
          lft: 233,
          rgt: 238,
        };
        const permissionEntries: Omit<PermissionsEntry, 'institutionId'>[] = [
          { level: 0, lft: 201, rgt: 300, permissions: ['a-1'] },
          { level: 5, lft: 230, rgt: 240, permissions: ['a-1', 'b-1'] },
          { level: 8, lft: 233, rgt: 238, permissions: ['c-1'] },
          { level: 10, lft: 235, rgt: 236, permissions: ['d-1'] },

          { level: 0, lft: 201, rgt: 300, permissions: ['e-1'] }, // repeated

          { level: 0, lft: 50, rgt: 200, permissions: ['f-1'] },
          { level: 4, lft: 100, rgt: 180, permissions: ['g-1'] },
        ];
        const expected = ['a-1', 'b-1', 'c-1', 'e-1'];
        const result = permissionsService['_getPermissionsForInstitution'](
          institution as Institution,
          permissionEntries as PermissionsEntry[]
        );
        expect(result).toEqual(expected);
      });
    });
  });
});
