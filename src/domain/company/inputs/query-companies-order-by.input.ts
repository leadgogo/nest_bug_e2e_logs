import { InputType, Field } from '@nestjs/graphql';
import { OrderDirection } from 'src/application/graphql/enums/order-direction.enum';

@InputType()
export class QueryCompaniesOrderByInput {
  @Field(() => OrderDirection, { nullable: true })
  name?: OrderDirection;

  @Field(() => OrderDirection, { nullable: true })
  timezone?: OrderDirection;
}
