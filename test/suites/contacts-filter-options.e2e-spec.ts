import '@leadgogo/e2e-helpers/dist/enhance-supertest';
import { EntityManager } from '@mikro-orm/mysql';
import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { ContactStage } from 'src/domain/contact/contact-stage/contact-stage.entity';
import { configureApp } from 'src/configure-app';
import supertest from 'supertest';
import { GqlResponseBody } from 'test/types/gql-response-body';
import { expectIsDefined } from 'test/utils/assertions';
import { makeSendGql } from 'test/utils/make-send-sql';

describe('contacts filter options', () => {
  let app: INestApplication;
  let request: supertest.SuperTest<supertest.Test>;
  let sendGql: ReturnType<typeof makeSendGql>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    const em: EntityManager = await moduleFixture.resolve(EntityManager);

    const contactStageRepository = em.getRepository(ContactStage);
    await contactStageRepository
      .createQueryBuilder()
      .update({ nameEs: 'Contacto' })
      .where({ slug: 'LEAD' })
      .execute();
    await contactStageRepository
      .createQueryBuilder()
      .update({ nameEs: 'Oportunidad' })
      .where({ slug: 'OPPORTUNITY' })
      .execute();
    await contactStageRepository
      .createQueryBuilder()
      .update({ nameEs: 'Cliente' })
      .where({ slug: 'CUSTOMER' })
      .execute();

    request = supertest(app.getHttpServer());
    await request
      .post('/v1/auth/login')
      .send({
        username: 'admin',
        password: 'admin1234',
      })
      .expect(200)
      .then((response) => {
        expect(response.body).toHaveProperty('token');
        const jwt = response.body.token;
        sendGql = makeSendGql(app, jwt);
      });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('i18n', () => {
    it('returns translated names for stages using explicit lang', async () => {
      await sendGql(`{
        contactsFilterOptions(institutionId: 1) {
          stages {
            nameEs: name(locale: "es"),
            nameEn: name(locale: "en")
          }
        }
      }`).then((response) => {
        const body = response.body as GqlResponseBody<{
          contactsFilterOptions: {
            stages: {
              nameEs: string;
              nameEn: string;
            }[];
          };
        }>;
        const {
          data: {
            contactsFilterOptions: { stages },
          },
        } = body;
        expectIsDefined(stages);
        expect(Array.isArray(stages)).toBeTruthy();
        expect(stages.length).toBe(3);
        expect(stages).toMatchObject([
          {
            nameEs: 'Contacto',
            nameEn: 'Lead',
          },
          {
            nameEs: 'Oportunidad',
            nameEn: 'Opportunity',
          },
          {
            nameEs: 'Cliente',
            nameEn: 'Customer',
          },
        ]);
      });
    });
    it('returns translated names using "name" property and using http header lang ES', async () => {
      await sendGql(
        `{
        contactsFilterOptions(institutionId: 1) {
          stages {
            name
          }
        }
      }`,
        { headers: { 'accept-language': 'es' } }
      ).then((response) => {
        const body = response.body as GqlResponseBody<{
          contactsFilterOptions: {
            stages: {
              name: string;
            }[];
          };
        }>;
        const {
          data: {
            contactsFilterOptions: { stages },
          },
        } = body;
        expectIsDefined(stages);
        expect(Array.isArray(stages)).toBeTruthy();
        expect(stages.length).toBe(3);
        expect(stages).toMatchObject([
          {
            name: 'Contacto',
          },
          {
            name: 'Oportunidad',
          },
          {
            name: 'Cliente',
          },
        ]);
      });
    });
  });
  it('returns translated names using "name" property and using http header lang EN', async () => {
    await sendGql(
      `{
      contactsFilterOptions(institutionId: 1) {
        stages {
          name
        }
      }
    }`,
      { headers: { 'accept-language': 'en' } }
    ).then((response) => {
      const body = response.body as GqlResponseBody<{
        contactsFilterOptions: {
          stages: {
            name: string;
          }[];
        };
      }>;
      const {
        data: {
          contactsFilterOptions: { stages },
        },
      } = body;
      expectIsDefined(stages);
      expect(Array.isArray(stages)).toBeTruthy();
      expect(stages.length).toBe(3);
      expect(stages).toMatchObject([
        {
          name: 'Lead',
        },
        {
          name: 'Opportunity',
        },
        {
          name: 'Customer',
        },
      ]);
    });
  });
  it('returns translated names using "name" property and using no lang http header (should default to "en")', async () => {
    await sendGql(`{
      contactsFilterOptions(institutionId: 1) {
        stages {
          name
        }
      }
    }`).then((response) => {
      const body = response.body as GqlResponseBody<{
        contactsFilterOptions: {
          stages: {
            name: string;
          }[];
        };
      }>;
      const {
        data: {
          contactsFilterOptions: { stages },
        },
      } = body;
      expectIsDefined(stages);
      expect(Array.isArray(stages)).toBeTruthy();
      expect(stages.length).toBe(3);
      expect(stages).toMatchObject([
        {
          name: 'Lead',
        },
        {
          name: 'Opportunity',
        },
        {
          name: 'Customer',
        },
      ]);
    });
  });
});
