import { ObjectType } from '@nestjs/graphql';
import { Connection } from 'src/application/graphql/lists/connection/connection.type';
import { Company } from '../company.entity';

@ObjectType()
export class CompanyConnection extends Connection(Company) {}
