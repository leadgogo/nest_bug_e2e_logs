import '@leadgogo/e2e-helpers/dist/enhance-supertest';
import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import supertest from 'supertest';
import { v4 as uuid } from 'uuid';
import { AppModule } from 'src/app.module';
import { configureApp } from 'src/configure-app';
import { GqlResponseBody } from 'test/types/gql-response-body';
import { makeSendGql } from 'test/utils/make-send-sql';
import { CreateContactOutput } from 'src/domain/contact/outputs/create-contact.output';
import { expectIsDefined } from 'test/utils/assertions';
import { ContactConnection } from 'src/domain/contact/outputs/contact-connection.output';

describe('multiple mutations', () => {
  let app: INestApplication;
  let request: supertest.SuperTest<supertest.Test>;
  let sendGql: ReturnType<typeof makeSendGql>;
  let contactId1: number;
  let contactId2: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

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

    const newEmail1 = `email-${uuid()}@service.com`;
    await sendGql(`
      mutation {
        createContact(
          input: {
            firstName: "Carlos",
            lastName: "first",
            email: "${newEmail1}",
            companyId: 1,
          }
        ) {
          contact {
            id, firstName, email
          }
        }
      }
    `).then((response) => {
      const body = response.body as GqlResponseBody<{
        createContact: CreateContactOutput;
      }>;
      const {
        data: { createContact },
      } = body;
      const {
        contact: { id },
      } = createContact;
      contactId1 = id;
    });

    const newEmail2 = `email-${uuid()}@service.com`;
    await sendGql(`
      mutation {
        createContact(
          input: {
            firstName: "Carlos",
            lastName: "first",
            email: "${newEmail2}",
            companyId: 1,
          }
        ) {
          contact {
            id, firstName, email
          }
        }
      }
    `).then((response) => {
      const body = response.body as GqlResponseBody<{
        createContact: CreateContactOutput;
      }>;
      const {
        data: { createContact },
      } = body;
      const {
        contact: { id },
      } = createContact;
      contactId2 = id;
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('can run multiple mutations successfully', async () => {
    await sendGql(`mutation {
      update1: updateContact(
        input: {
          contactId: ${contactId1},
          lastName: "successful"
        }
      ) {
        contact {
          id,
          firstName,
          lastName,
          fullName,
          company {
            name
          }
        }
      }
      update2: updateContact(
        input: {
          contactId: ${contactId2},
          lastName: "successful"
        }
      ) {
        contact {
          id,
          firstName,
          lastName,
          fullName,
          company {
            name
          }
        }
      }
    }`).then((response) => {
      const body = response.body as GqlResponseBody<{
        contacts: ContactConnection;
      }>;
      const { errors } = body;
      expect(errors).not.toBeDefined();
    });
  });

  it('if first mutation fails, everything is rolled back', async () => {
    await sendGql(`mutation {
      update1: updateContact(
        input: {
          contactId: ${contactId1},
          lastName: "fail",
          email: "dannyrulez@gmail.com"
        }
      ) {
        contact {
          id,
          firstName,
          lastName,
          fullName,
          company {
            name
          }
        }
      }
      update2: updateContact(
        input: {
          contactId: ${contactId2},
          lastName: "fail"
        }
      ) {
        contact {
          id,
          firstName,
          lastName,
          fullName,
          company {
            name
          }
        }
      }
    }`).then((response) => {
      const body = response.body as GqlResponseBody;
      const { errors } = body;
      expectIsDefined(errors);
      const error = errors.find(
        (error) =>
          error.extensions.category === 'BUSINESS_RULE' &&
          error.extensions.code === 'EMAIL_EXISTS'
      );
      expectIsDefined(error);
    });
    await sendGql(`{
      contacts(
        where: {
          _or: [
            { id: { _eq: ${contactId1} } },
            { id: { _eq: ${contactId2} } }
          ]
        }
      ) {
        totalCount,
        nodes {
          id,
          lastName
        }
      }
    }`).then((response) => {
      const body = response.body as GqlResponseBody<{
        contacts: ContactConnection;
      }>;
      const {
        errors,
        data: { contacts },
      } = body;
      expect(errors).not.toBeDefined();
      expectIsDefined(contacts);
      expect(contacts.totalCount).toBe(2);
      expectIsDefined(contacts.nodes);
      expect(contacts.nodes[0].lastName).toBe('successful');
      expect(contacts.nodes[1].lastName).toBe('successful');
    });
  });

  it('if second mutation fails, everything is rolled back', async () => {
    await sendGql(`mutation {
      update1: updateContact(
        input: {
          contactId: ${contactId1},
          lastName: "fail"
        }
      ) {
        contact {
          id,
          firstName,
          lastName,
          fullName,
          company {
            name
          }
        }
      }
      update2: updateContact(
        input: {
          contactId: ${contactId2},
          lastName: "fail",
          email: "dannyrulez@gmail.com"
        }
      ) {
        contact {
          id,
          firstName,
          lastName,
          fullName,
          company {
            name
          }
        }
      }
    }`).then((response) => {
      const body = response.body as GqlResponseBody;
      const { errors } = body;
      expectIsDefined(errors);
      const error = errors.find(
        (error) =>
          error.extensions.category === 'BUSINESS_RULE' &&
          error.extensions.code === 'EMAIL_EXISTS'
      );
      expectIsDefined(error);
    });
    await sendGql(`{
      contacts(
        where: {
          _or: [
            { id: { _eq: ${contactId1} } },
            { id: { _eq: ${contactId2} } }
          ]
        }
      ) {
        totalCount,
        nodes {
          id,
          lastName
        }
      }
    }`).then((response) => {
      const body = response.body as GqlResponseBody<{
        contacts: ContactConnection;
      }>;
      const {
        errors,
        data: { contacts },
      } = body;
      expect(errors).not.toBeDefined();
      expectIsDefined(contacts);
      expect(contacts.totalCount).toBe(2);
      expectIsDefined(contacts.nodes);
      expect(contacts.nodes[0].lastName).toBe('successful');
      expect(contacts.nodes[1].lastName).toBe('successful');
    });
  });
});
