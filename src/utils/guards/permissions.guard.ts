import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import {
  GraphQLResolveInfo,
  GraphQLObjectType,
  GraphQLScalarType,
} from 'graphql';
import { AuthorizationService } from 'src/application/authorization/authorization.service';
import { getRealType } from 'src/application/graphql/helpers/get-real-type.helper';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private authorizationService: AuthorizationService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (ctx.getType() === 'http') {
      return true;
    }

    const info = GqlExecutionContext.create(ctx).getInfo<GraphQLResolveInfo>();

    const parentType = getRealType(info.parentType);
    const returnType = getRealType(info.returnType);

    const { fieldName } = info;

    let permissions: string[] | undefined;

    if (returnType instanceof GraphQLScalarType) {
      if (!(parentType instanceof GraphQLObjectType)) {
        return true;
      }
      const fields = parentType.getFields();
      const field = Object.entries(fields).find(([name]) => name === fieldName);
      if (field) {
        permissions = field[1].extensions?.permissions;
      }
    } else if (returnType instanceof GraphQLObjectType) {
      permissions = returnType.extensions?.permissions;
    }

    if (permissions) {
      await this.authorizationService.requirePermissionsForDefaultInstitution(
        permissions
      );
    }

    return true;
  }
}
