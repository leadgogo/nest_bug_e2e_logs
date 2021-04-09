import {
  Args,
  ArgsType,
  Field,
  GraphQLModule,
  GraphQLSchemaHost,
  ObjectType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLSchema, printSchema } from 'graphql';
import { OrderDirection } from 'src/application/graphql/enums/order-direction.enum';
import { StringWhereInput } from 'src/application/graphql/inputs/string-where.input';
import { ListArg } from 'src/application/graphql/lists/list-args/list-arg.decorator';
import { BaseListArgs } from 'src/application/graphql/lists/list-args/base-list-args.class';
import {
  ObjectOrderByInput,
  ObjectOrderByInputType,
} from 'src/application/graphql/lists/list-args/order-by-input/order-by-input';
import {
  ObjectWhereInput,
  ObjectWhereInputType,
} from 'src/application/graphql/lists/list-args/where-input/where-input';

@ObjectType()
class Todo {
  @Field()
  id: string;

  @ListArg()
  @Field()
  description: string;

  @ListArg('User')
  @Field(() => User)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
}

@ObjectType()
class User {
  @Field()
  id: string;

  @ListArg()
  @Field()
  name: string;

  @ListArg(() => [Todo])
  @Field(() => [Todo])
  todos: Todo[];
}

@ObjectWhereInputType(() => Todo)
class TodoWhereInput extends ObjectWhereInput(Todo) {
  @Field({ nullable: true })
  testDescription?: StringWhereInput;
}

@ObjectOrderByInputType(() => User)
class UserOrderByInput extends ObjectOrderByInput(User) {
  @Field(() => OrderDirection, { nullable: true })
  testName?: OrderDirection;
}

@ArgsType()
class TodoListArgs extends BaseListArgs(Todo) {
  @Field({ nullable: true })
  where?: TodoWhereInput;
}

@ArgsType()
class UserListArgs extends BaseListArgs(User) {
  @Field({ nullable: true })
  orderBy?: UserOrderByInput;
}

@Resolver(() => Todo)
class TodoResolver {
  @Query(() => [Todo])
  todos(@Args() args: TodoListArgs): Promise<Todo[]> {
    throw new Error('Not implemented.');
  }
}

@Resolver(() => User)
class UserResolver {
  @Query(() => [User])
  users(@Args() args: UserListArgs): Promise<User[]> {
    throw new Error('Not implemented.');
  }
}

describe('Schema generation', () => {
  let schemaHost: GraphQLSchemaHost;
  let schema: GraphQLSchema;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot({
          autoSchemaFile: true,
          sortSchema: true,
        }),
      ],
      providers: [TodoResolver, UserResolver, StringWhereInput],
    }).compile();
    const app = module.createNestApplication();
    await app.init();

    schemaHost = module.get(GraphQLSchemaHost);
    schema = schemaHost.schema;
  });

  it('generated and expected schemas are equal', () => {
    const generated = printSchema(schema);
    const expected = `
enum OrderDirection {
  ASC
  DESC
}

type Query {
  todos(after: String, before: String, first: Int, last: Int, orderBy: TodoOrderByInput, where: TodoWhereInput): [Todo!]!
  users(after: String, before: String, first: Int, last: Int, orderBy: UserOrderByInput, where: UserWhereInput): [User!]!
}

input StringWhereInput {
  _contains: String
  _eq: String
}

type Todo {
  description: String!
  id: String!
  user: User!
}

input TodoListWhereInput {
  _all: TodoWhereInput
  _any: TodoWhereInput
  _every: TodoWhereInput
  _none: TodoWhereInput
  _some: TodoWhereInput
}

input TodoOrderByInput {
  description: OrderDirection
  user: UserOrderByInput
}

input TodoWhereInput {
  _and: [TodoWhereInput!]
  _not: TodoWhereInput
  _or: [TodoWhereInput!]
  description: StringWhereInput
  testDescription: StringWhereInput
  user: UserWhereInput
}

type User {
  id: String!
  name: String!
  todos: [Todo!]!
}

input UserOrderByInput {
  name: OrderDirection
  testName: OrderDirection
}

input UserWhereInput {
  _and: [UserWhereInput!]
  _not: UserWhereInput
  _or: [UserWhereInput!]
  name: StringWhereInput
  todos: TodoListWhereInput
}`;
    expect(generated.trim()).toEqual(expected.trim());
  });
});
