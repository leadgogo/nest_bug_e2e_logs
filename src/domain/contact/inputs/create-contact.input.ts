import { InputType, Field, Int } from '@nestjs/graphql';
import { IsEmail, IsNumber } from 'class-validator';

@InputType()
export class CreateContactInput {
  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @IsEmail()
  @Field()
  email: string;

  @IsNumber()
  @Field(() => Int)
  companyId: number;
}
