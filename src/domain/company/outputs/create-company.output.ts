import { Field, ObjectType } from '@nestjs/graphql';
import { Company } from 'src/domain/company/company.entity';

@ObjectType()
export class CreateCompanyOutput {
  @Field({ nullable: true })
  company: Company;
}
