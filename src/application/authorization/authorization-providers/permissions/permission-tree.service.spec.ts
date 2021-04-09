import { TestingModule, Test } from '@nestjs/testing';
import { Role } from 'src/domain/role/role.entity';
import { Institution } from '../../../../domain/institution/institution.entity';
import { RoleService } from '../../../../domain/role/role.service';
import { RedisService } from '@leadgogo/backend-utils';
import { PermissionTreeService } from './permission-tree.service';

describe('Permission Tree service', () => {
  let roleService: jest.Mocked<RoleService>;
  let permissionTreeService: PermissionTreeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: RedisService,
          useValue: jest.fn(),
        },
        {
          provide: RoleService,
          useValue: {
            getPermissionsForRole: jest.fn(),
          },
        },
        PermissionTreeService,
      ],
    }).compile();

    roleService = module.get(RoleService);
    permissionTreeService = module.get<PermissionTreeService>(
      PermissionTreeService
    );
  });

  it('getPermissionsForRoles generates the correct structure', async () => {
    roleService.getPermissionsForRole.mockResolvedValueOnce([
      'permission1',
      'permission2',
    ]);
    roleService.getPermissionsForRole.mockResolvedValueOnce([
      'permission3',
      'permission4',
    ]);
    const result = await permissionTreeService['getPermissionsForRoles']([
      'role-id-1',
      'role-id-2',
    ]);
    const expected = {
      'role-id-1': ['permission1', 'permission2'],
      'role-id-2': ['permission3', 'permission4'],
    };
    expect(result).toEqual(expected);
  });

  it('getPermissionsEntry generates the correct structure', () => {
    const institution: Partial<Institution> = {
      id: 12,
      lft: 4,
      rgt: 10,
      level: 2,
    };
    const role = {
      id: 'role1',
    };
    const rolePermissions = {
      role1: ['permission1', 'permission2'],
    };
    const expected = {
      institutionId: 12,
      lft: 4,
      rgt: 10,
      level: 2,
      permissions: ['permission1', 'permission2'],
    };
    expect(
      permissionTreeService['getPermissionsEntry'](
        institution as Institution,
        (role as unknown) as Role,
        rolePermissions
      )
    ).toEqual(expected);
  });
});
