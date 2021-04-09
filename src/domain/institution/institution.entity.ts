import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Institution {
  @PrimaryKey()
  id: number;

  @Property()
  name: string;

  @Property()
  type: string;

  @Property()
  lft: number;

  @Property()
  rgt: number;

  @Property()
  level: number;
}
