import {
  GraphQLOutputType,
  GraphQLNonNull,
  GraphQLScalarType,
  GraphQLObjectType,
  GraphQLList,
} from 'graphql';

export function getRealType(
  type: GraphQLOutputType
): GraphQLObjectType | GraphQLScalarType {
  let currentType = type;
  while (
    currentType instanceof GraphQLNonNull ||
    currentType instanceof GraphQLList
  ) {
    currentType = currentType.ofType;
  }
  return currentType as GraphQLScalarType | GraphQLObjectType;
}
