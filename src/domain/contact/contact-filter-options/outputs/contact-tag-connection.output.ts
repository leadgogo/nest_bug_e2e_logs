import { ObjectType } from '@nestjs/graphql';
import { Connection } from 'src/application/graphql/lists/connection/connection.type';
import { ContactTag } from '../../contact-tag/contact-tag.entity';

@ObjectType()
export class ContactTagConnection extends Connection(ContactTag) {}
