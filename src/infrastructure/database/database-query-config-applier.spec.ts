/* eslint @typescript-eslint/no-explicit-any: off */
import { TestingModule, Test } from '@nestjs/testing';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import {
  DatabaseQueryConfigApplier,
  JoinConfig,
} from './database-query-config-applier';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { entities } from 'src/infrastructure/database/entities';

describe('Database QueryConfig Applier', () => {
  let orm: MikroORM;
  let em: EntityManager;
  let applier: DatabaseQueryConfigApplier;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MikroOrmModule.forRoot({
          entities,
          type: 'sqlite',
          dbName: 'test.sqlite3',
        }),
        MikroOrmModule.forFeature({ entities }),
      ],
      providers: [DatabaseQueryConfigApplier],
    }).compile();

    orm = module.get<MikroORM>(MikroORM);
    em = module.get<EntityManager>(EntityManager);
    applier = module.get<DatabaseQueryConfigApplier>(
      DatabaseQueryConfigApplier
    );
  });

  afterEach(async () => {
    await orm.close();
  });

  describe('transformOperand', () => {
    it('_eq', () => {
      expect(applier['transformCondition']('_eq', 'value')).toEqual([
        '$eq',
        'value',
      ]);
    });
    it('_contains', () => {
      expect(applier['transformCondition']('_contains', 'value')).toEqual([
        '$like',
        `%value%`,
      ]);
    });
  });
  describe('generateOrderByObject', () => {
    it('a direct field', () => {
      const entityName = 'Contact';
      const qb = em.createQueryBuilder(entityName);
      const joinConfigs: JoinConfig[] = [];
      const orderByInput = { firstName: 'asc' };
      const expectedOrderByObj = {
        firstName: 'asc',
      };
      const orderByObj = applier['generateOrderByObject'](
        qb,
        entityName,
        orderByInput,
        []
      );
      expect(joinConfigs).toEqual([]);
      expect(orderByObj).toEqual(expectedOrderByObj);
    });
    it('a direct and a nested field', () => {
      const entityName = 'Contact';
      const qb = em.createQueryBuilder(entityName);
      const joinConfigs: JoinConfig[] = [];
      const orderByInput = { firstName: 'asc', company: { name: 'desc' } };
      const expectedOrderByObj = {
        firstName: 'asc',
        'e1.name': 'desc',
      };
      const orderByObj = applier['generateOrderByObject'](
        qb,
        entityName,
        orderByInput,
        joinConfigs
      );
      expect(joinConfigs).toHaveLength(1);
      expect(orderByObj).toEqual(expectedOrderByObj);
    });
  });
  describe('generateWhereObj', () => {
    describe('general', () => {
      it('one field with _eq operator', () => {
        const entityName = 'Contact';
        const qb = em.createQueryBuilder(entityName);
        const value = 'carlos.rgn@gmail.com';
        const whereInput = { email: { _eq: value } };
        const expectedWhereObject = { $and: [{ email: { $eq: value } }] };
        const whereObj = applier['generateWhereObject'](
          qb,
          entityName,
          whereInput,
          []
        );
        expect(whereObj).toEqual(expectedWhereObject);
      });
      it('one field with _contains operator', () => {
        const entityName = 'Contact';
        const qb = em.createQueryBuilder(entityName);
        const value = 'Carlos';
        const whereInput = { email: { _contains: value } };
        const expectedWhereObject = {
          $and: [{ email: { $like: `%${value}%` } }],
        };
        const whereObj = applier['generateWhereObject'](
          qb,
          entityName,
          whereInput,
          []
        );
        expect(whereObj).toEqual(expectedWhereObject);
      });
      it('two fields', () => {
        const entityName = 'Contact';
        const qb = em.createQueryBuilder(entityName);
        const whereInput = {
          email: { _eq: 'email' },
          firstName: { _contains: 'name' },
        };
        const expectedWhereObject = {
          $and: [
            { email: { $eq: 'email' } },
            { firstName: { $like: '%name%' } },
          ],
        };
        const whereObj = applier['generateWhereObject'](
          qb,
          entityName,
          whereInput,
          []
        );
        expect(whereObj).toEqual(expectedWhereObject);
      });
      it('one field and one OR operator with two fields', () => {
        const entityName = 'Contact';
        const qb = em.createQueryBuilder(entityName);
        const whereInput = {
          email: { _eq: '1' },
          _or: [{ email: { _eq: '2' } }, { firstName: { _contains: '3' } }],
        };
        // prettier-ignore
        const expectedWhereObject = {
          $and: [
            { email: { $eq: '1' } },
            {
              $or: [
                { email: { $eq: '2' } },
                { firstName: { $like: '%3%' } },
              ],
            },
          ],
        };
        const whereObj = applier['generateWhereObject'](
          qb,
          entityName,
          whereInput,
          []
        );
        expect(whereObj).toEqual(expectedWhereObject);
      });
      it('one field and a relationship with one field', () => {
        const entityName = 'Contact';
        const qb = em.createQueryBuilder(entityName);
        const whereInput = {
          firstName: { _contains: 'Carlos' },
          company: {
            name: { _eq: 'some-name' },
          },
        };
        const expectedWhereObject = {
          $and: [
            {
              firstName: {
                $like: '%Carlos%',
              },
            },
            {
              'e1.name': {
                $eq: 'some-name',
              },
            },
          ],
        };
        const joinConfigs: JoinConfig[] = [];
        const whereObj = applier['generateWhereObject'](
          qb,
          entityName,
          whereInput,
          joinConfigs
        );
        expect(joinConfigs).toHaveLength(1);
        expect(whereObj).toEqual(expectedWhereObject);
      });
      it('with a pre-existing entity alias, where obj should use that same alias', () => {
        const entityName = 'Contact';
        const companyAlias = 'c';
        const qb = em
          .createQueryBuilder(entityName)
          .join('company', companyAlias)
          .join('c.institution', 'i')
          .where({
            $and: [{ 'i.lft': 3 }],
          });
        // expect(2).toEqual(2);
        // prettier-ignore
        const whereInput = {
          firstName: { _eq: 'Person' },
          company: { name: { _eq: 'some-name' }, },
        };
        // prettier-ignore
        const expectedWhereObject = {
          $and: [
            { firstName: { $eq: 'Person' } },
            { [`${companyAlias}.name`]: { $eq: 'some-name' } },
          ],
        };
        const joinConfigs: JoinConfig[] = [];
        const whereObj = applier['generateWhereObject'](
          qb,
          entityName,
          whereInput,
          joinConfigs
        );
        expect(joinConfigs).toHaveLength(1);
        const [{ alias: generatedAlias }] = joinConfigs;
        expect(whereObj).toEqual(expectedWhereObject);
        expect(generatedAlias).toEqual(companyAlias);
      });
      it('one field and a relationship with one OR operator with two fields', () => {
        const entityName = 'Contact';
        const qb = em.createQueryBuilder(entityName);
        // prettier-ignore
        const whereInput = {
          firstName: { _contains: 'Carlos' },
          company: {
            _or: [
              { name: { _eq: 'some-name' } },
              { timezone: { _contains: 'zone' } },
            ],
          },
        };
        // prettier-ignore
        const expectedWhereObject = {
          $and: [
            { firstName: { $like: '%Carlos%' } },
            {
              $or: [
                { 'e1.name': { $eq: 'some-name' } },
                { 'e1.timezone': { $like: '%zone%' } },
              ],
            },
          ],
        };
        const joinConfigs: JoinConfig[] = [];
        const whereObj = applier['generateWhereObject'](
          qb,
          entityName,
          whereInput,
          joinConfigs
        );
        expect(joinConfigs).toHaveLength(1);
        expect(whereObj).toEqual(expectedWhereObject);
      });
      it('one field and one OR operator with one field and two relationship fields', () => {
        const entityName = 'Contact';
        const qb = em.createQueryBuilder(entityName);
        // prettier-ignore
        const whereInput = {
          firstName: { _contains: 'Carlos' },
          _or: [
            { email: { _contains: 'gmail' } },
            { company: { name: { _eq: 'some-name' } } },
            { company: { timezone: { _contains: 'zone' } } },
          ],
        };
        // prettier-ignore
        const expectedWhereObject = {
          $and: [
            { firstName: { $like: '%Carlos%' } },
            {
              $or: [
                { email: { $like: '%gmail%' } },
                { 'e1.name': { $eq: 'some-name' } },
                { 'e1.timezone': { $like: '%zone%' } },
              ],
            },
          ],
        };
        const joinConfigs: JoinConfig[] = [];
        const whereObj = applier['generateWhereObject'](
          qb,
          entityName,
          whereInput,
          joinConfigs
        );
        expect(joinConfigs).toHaveLength(1);
        expect(whereObj).toEqual(expectedWhereObject);
      });
    });
    describe('scalar logical operators', () => {
      it('_or and _and operators with array values', () => {
        const entityName = 'Contact';
        const qb = em.createQueryBuilder(entityName);
        // prettier-ignore
        const whereInput = {
          _and: [
            { firstName: { _contains: 'c' } },
            { company: { name: { _eq: 'q' } } }
          ],
          _or: [
            { email: { _contains: '3' } },
            { email: { _eq: '1' } }
          ],
        };
        // prettier-ignore
        const expectedWhereObject = {
          $and: [
            { $and: [
              { firstName: { $like: '%c%' } },
              { 'e1.name': { $eq: 'q' } }
            ]},
            { $or: [
              { email: { $like: '%3%' } },
              { email: { $eq: '1' } },
            ]}
          ],
        };
        const whereObj = applier['generateWhereObject'](
          qb,
          entityName,
          whereInput,
          []
        );
        expect(whereObj).toEqual(expectedWhereObject);
      });
      it('_or and _and operator with non-array value throws', () => {
        const entityName = 'Contact';
        const qb = em.createQueryBuilder(entityName);
        // prettier-ignore
        const whereInput = {
          _and: {
            firstName: { _contains: 'c' },
            company: { name: { _eq: 'q' } }
          }
        };
        const whereObj = () => {
          applier['generateWhereObject'](qb, entityName, whereInput, []);
        };
        expect(whereObj).toThrow();
      });
      it('_not operator with non-array value', () => {
        const entityName = 'Contact';
        const qb = em.createQueryBuilder(entityName);
        // prettier-ignore
        const whereInput = {
          _not: { email: { _contains: '3' } }
        };
        // prettier-ignore
        const expectedWhereObject = {
          $and: [
            { $not: { email: { $like: '%3%' } } }
          ],
        };
        const whereObj = applier['generateWhereObject'](
          qb,
          entityName,
          whereInput,
          []
        );
        expect(whereObj).toEqual(expectedWhereObject);
      });
      it('_not operator with array value throws', () => {
        const entityName = 'Contact';
        const qb = em.createQueryBuilder(entityName);
        // prettier-ignore
        const whereInput = {
          _not: [
            { email: { _contains: '3' } }
          ]
        };
        const whereObj = () => {
          applier['generateWhereObject'](qb, entityName, whereInput, []);
        };
        expect(whereObj).toThrow();
      });
    });
    describe('list operators', () => {
      it('and ( _any/_some, _all/_every, _none )', () => {
        const entityName = 'Company';
        const qb = em.createQueryBuilder(entityName);
        // prettier-ignore
        const whereInput = {
          name: { _contains: 'c' },
          _and: [
            { contacts: {
              _some: {
                firstName: { _contains: 't' },
                _or: [
                  { lastName: { _contains: 'b' } },
                  { lastName: { _contains: 'c' } }
                ]
              }
            } },
            { contacts: {
              _all: {
                firstName: { _contains: 'z' },
              }
            } },
            { contacts: {
              _none: {
                firstName: { _contains: 'w' },
              }
            } }
          ]
        };
        // prettier-ignore
        const expectedWhereObjectWithoutSubqueries = {
          $and: [
            { name: { $like: '%c%' } },
            { $and: [
              { id: { $in: {} } },
              { id: { $nin: {} } },
              { id: { $nin: {} } },
            ] }
          ],
        };
        const expectedSubqueries = [
          {
            sql:
              'select `e0`.`id` from `company` as `e0` inner join `lead` as `r` on `e0`.`id` = `r`.`company_id` where `r`.`first_name` like ? and (`r`.`last_name` like ? or `r`.`last_name` like ?)',
            bindings: ['%t%', '%b%', '%c%'],
          },
          {
            sql:
              'select `e0`.`id` from `company` as `e0` left join `lead` as `r` on `e0`.`id` = `r`.`company_id` where (not (`r`.`first_name` like ?) or `r`.`id` is null)',
            bindings: ['%z%'],
          },
          {
            sql:
              'select `e0`.`id` from `company` as `e0` left join `lead` as `r` on `e0`.`id` = `r`.`company_id` where ((`r`.`first_name` like ?) or `r`.`id` is null)',
            bindings: ['%w%'],
          },
        ];
        const whereObj = applier['generateWhereObject'](
          qb,
          entityName,
          whereInput,
          []
        );
        const subqueries = [
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          whereObj.$and[1].$and[0].id.$in.toSQL(),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          whereObj.$and[1].$and[1].id.$nin.toSQL(),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          whereObj.$and[1].$and[2].id.$nin.toSQL(),
        ];
        expect(whereObj).toMatchObject(expectedWhereObjectWithoutSubqueries);
        expect(subqueries).toMatchObject(expectedSubqueries);
      });
      it('nested list operators', () => {
        const entityName = 'Company';
        const qb = em.createQueryBuilder(entityName);
        // prettier-ignore
        const whereInput = {
          campaigns: {
            _none: {
              _and: [
                { name: { _contains: "foo" } },
                {
                  agents: {
                    _none: {
                      type: { _contains: "bar" },
                    },
                  },
                },
              ],
            },
          },
        };
        // prettier-ignore
        const expectedWhereObjectWithoutSubquery = {
          $and: [
            { id: { $nin: {} } }
          ],
        };
        const expectedSubquery = {
          sql:
            'select `e0`.`id` from `company` as `e0` left join `campaign` as `r` on `e0`.`id` = `r`.`company_id` where ((`r`.`name` like ? and `e0`.`id` not in (select `e0`.`id` from `campaign` as `e0` left join `campaign_agent` as `r` on `e0`.`id` = `r`.`campaign_id` where ((`r`.`type` like ?) or `r`.`id` is null))) or `r`.`id` is null)',
          bindings: ['%foo%', '%bar%'],
        };
        const whereObj = applier['generateWhereObject'](
          qb,
          entityName,
          whereInput,
          []
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const subquery = whereObj.$and[0].id.$nin.toSQL();
        expect(whereObj).toMatchObject(expectedWhereObjectWithoutSubquery);
        expect(subquery).toMatchObject(expectedSubquery);
      });
    });
  });
});
