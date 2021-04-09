import { ObjectType } from '@nestjs/graphql';
import { Connection } from 'src/application/graphql/lists/connection/connection.type';
import { Contact } from '../contact.entity';

@ObjectType()
export class ContactConnection extends Connection(Contact) {}
