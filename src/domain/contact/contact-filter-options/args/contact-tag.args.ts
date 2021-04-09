import { ArgsType } from '@nestjs/graphql';
import { BaseListArgs } from 'src/application/graphql/lists/list-args/base-list-args.class';
import { ContactTag } from '../../contact-tag/contact-tag.entity';

@ArgsType()
export class ContactTagArgs extends BaseListArgs(ContactTag) {}
