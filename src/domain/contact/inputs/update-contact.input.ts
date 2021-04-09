import { InputType, Field, Int } from '@nestjs/graphql';
import { IsEmail, IsNumber, IsOptional } from 'class-validator';

@InputType()
export class UpdateContactInput {
  @Field(() => Int)
  contactId: number;

  @IsOptional()
  @Field({ nullable: true })
  firstName?: string;

  @IsOptional()
  @Field({ nullable: true })
  lastName?: string;

  @IsEmail()
  @IsOptional()
  @Field({ nullable: true })
  email?: string;

  @IsNumber()
  @IsOptional()
  @Field(() => Int, { nullable: true })
  companyId?: number;
}
