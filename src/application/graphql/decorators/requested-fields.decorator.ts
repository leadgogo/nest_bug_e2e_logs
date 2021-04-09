import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext, TypeMetadataStorage } from '@nestjs/graphql';
import {
  GraphQLResolveInfo,
  GraphQLObjectType,
  GraphQLScalarType,
} from 'graphql';
import graphqlFields from 'graphql-fields';
import { defined } from '@leadgogo/backend-utils';
import { getRealType } from '../helpers/get-real-type.helper';

export function getRequestedFields(
  returnType: GraphQLObjectType | GraphQLScalarType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requestedGraphQlFields: any,
  onlyScalar = false
): string[] {
  if (returnType instanceof GraphQLScalarType) {
    throw new Error('This decorator cannot be used on scalar field resolvers.');
  }
  const objectType = defined(
    TypeMetadataStorage.getObjectTypesMetadata().find(
      (m) => m.name === returnType.name
    )
  );
  const properties = defined(objectType.properties);
  const fields = returnType.getFields();
  const requestedFields: string[] = [];
  for (const key of Object.keys(requestedGraphQlFields)) {
    const [, field] = defined(
      Object.entries(fields).find(([name]) => name === key)
    );
    if (!onlyScalar || getRealType(field.type) instanceof GraphQLScalarType) {
      const { name: propertyName } = defined(
        properties.find((p) => p.schemaName === key)
      );
      requestedFields.push(propertyName);
    }
  }
  return requestedFields;
}

export const RequestedScalarFields = createParamDecorator(
  (data: undefined, ctx: ExecutionContext): string[] => {
    const info = GqlExecutionContext.create(ctx).getInfo<GraphQLResolveInfo>();
    const returnType = getRealType(info.returnType);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const requestedGraphQlFields = graphqlFields(info);
    const requestedFields = getRequestedFields(
      returnType,
      requestedGraphQlFields,
      true
    );
    return requestedFields;
  }
);

export const RequestedFields = createParamDecorator(
  (data: undefined, ctx: ExecutionContext): string[] => {
    const info = GqlExecutionContext.create(ctx).getInfo<GraphQLResolveInfo>();
    const returnType = getRealType(info.returnType);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const requestedGraphQlFields = graphqlFields(info);
    const requestedFields = getRequestedFields(
      returnType,
      requestedGraphQlFields,
      false
    );
    return requestedFields;
  }
);
