import '@leadgogo/e2e-helpers/dist/enhance-supertest';
import { TestingModule, Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ContextIdFactory } from '@nestjs/core';
import { defined } from '@leadgogo/backend-utils';
import supertest from 'supertest';
import { v4 as uuid } from 'uuid';
import { makeSendGql } from 'test/utils/make-send-sql';
import { GqlResponseBody } from 'test/types/gql-response-body';
import { expectIsDefined } from 'test/utils/assertions';
import { CompanyService } from 'src/domain/company/company.service';
import { AppModule } from 'src/app.module';
import { configureApp } from 'src/configure-app';
import { ContactConnection } from 'src/domain/contact/outputs/contact-connection.output';
import { Contact } from 'src/domain/contact/contact.entity';
import { PermissionsService } from 'src/application/authorization/authorization-providers/permissions/permissions.service';
import { CreateContactOutput } from 'src/domain/contact/outputs/create-contact.output';
import { UpdateContactOutput } from 'src/domain/contact/outputs/update-contact.output';

describe('contacts', () => {
  let moduleFixture: TestingModule;
  let app: INestApplication;
  let request: supertest.SuperTest<supertest.Test>;
  let sendGql: ReturnType<typeof makeSendGql>;
  let permissionsService: PermissionsService;
  let companyService: CompanyService;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    const contextId = ContextIdFactory.create();
    jest
      .spyOn(ContextIdFactory, 'getByRequest')
      .mockImplementation(() => contextId);

    permissionsService = await moduleFixture.resolve<PermissionsService>(
      PermissionsService,
      contextId
    );
    companyService = await moduleFixture.resolve<CompanyService>(
      CompanyService,
      contextId
    );

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

  beforeEach(async () => {});

  describe('query list', () => {
    it('can obtain a list of contacts', async () => {
      await sendGql(`{
        contacts {
          nodes {
            id, firstName
          }
        }
      }`).then((response) => {
        const body = response.body as GqlResponseBody<{
          contacts: ContactConnection;
        }>;
        const {
          data: {
            contacts: { nodes },
          },
        } = body;
        expectIsDefined(nodes);
        expect(Array.isArray(nodes)).toBeTruthy();
        expect(nodes.length).toBeGreaterThan(0);
      });
    });
    it('n+1 situation uses data loader', async () => {
      const getOneSpy = jest.spyOn(companyService, 'getOne');
      const getManySpy = jest.spyOn(companyService, 'getMany');
      await sendGql(`{
        contacts {
          nodes {
            firstName,
            company {
              id,
              name
            }
          }
        }
      }`).then((response) => {
        const body = response.body as GqlResponseBody<{
          contacts: ContactConnection;
        }>;
        const {
          data: {
            contacts: { nodes },
          },
        } = body;
        expectIsDefined(nodes);
        expect(nodes.length).toBeGreaterThan(0);
        expect(getOneSpy).not.toHaveBeenCalled();
        expect(getManySpy).toHaveBeenCalledTimes(1);
        const companyIds = Array.from(
          new Set(
            nodes
              .map((contact) => contact.company?.id)
              .filter((id) => typeof id !== 'undefined')
              .map((id) => defined(id))
              .sort((a, b) => a - b)
          )
        );
        expect(getManySpy).toHaveBeenCalledWith(['id', 'name'], companyIds);
      });
    });
    it('can filter contacts by name', async () => {
      await sendGql(`{
        contacts(
          where: {
            firstName: { _contains: "Daniel" }
          }
        ) {
          nodes {
            firstName
          }
        }
      }`).then((response) => {
        const body = response.body as GqlResponseBody<{
          contacts: ContactConnection;
        }>;
        const {
          data: {
            contacts: { nodes },
          },
        } = body;
        expectIsDefined(nodes);
        expect(nodes.length).toBeGreaterThan(0);
        expect(nodes.every((c) => c.firstName?.match(/Daniel/))).toEqual(true);
      });
    });

    describe('pagination', () => {
      const middleCursor = 'eyJjLm5hbWUiOiJQcm9iYW5kbyIsImUwLmlkIjoxNDQwfQ==';
      it('gets all relevant connection data', async () => {
        await sendGql(`{
          contacts(
            where: {
              email: { _contains: "dani" }
            },
            orderBy: {
              company: {
                name: ASC
              }
            }
          ) {
            totalCount,
            edges {
              cursor,
              node {
                firstName
              }
            },
            pageInfo {
              startCursor,
              endCursor,
              hasPreviousPage,
              hasNextPage
            }
          }
        }`).then((response) => {
          const body = response.body as GqlResponseBody<{
            contacts: ContactConnection;
          }>;
          const {
            data: {
              contacts: { totalCount, edges, pageInfo },
            },
          } = body;
          expectIsDefined(totalCount);
          expectIsDefined(edges);
          expectIsDefined(pageInfo);
          expect(edges.length).toBe(5);
          expect(totalCount).toBe(5);
          expect(edges[0].cursor).toBe(
            'eyJjLm5hbWUiOiJBQ01FIEluYy4iLCJlMC5pZCI6NDh9'
          );
          expect(edges[edges.length - 1].cursor).toBe(
            'eyJjLm5hbWUiOiJQcm9iYW5kbyIsImUwLmlkIjoxNTU3fQ=='
          );
          expect(pageInfo.startCursor).toBe(edges[0].cursor);
          expect(pageInfo.endCursor).toBe(edges[edges.length - 1].cursor);
          expect(pageInfo.hasPreviousPage).toBe(false);
          expect(pageInfo.hasNextPage).toBe(false);
          expect(edges[2].cursor).toBe(
            'eyJjLm5hbWUiOiJQcm9iYW5kbyIsImUwLmlkIjoxNDQwfQ=='
          );
        });
      });
      it('can get the first 2', async () => {
        await sendGql(`{
          contacts(
            where: {
              email: { _contains: "dani" }
            },
            orderBy: {
              company: {
                name: ASC
              }
            },
            first: 2
          ) {
            totalCount,
            edges {
              cursor,
              node {
                firstName
              }
            },
            pageInfo {
              startCursor,
              endCursor,
              hasPreviousPage,
              hasNextPage
            }
          }
        }`).then((response) => {
          const body = response.body as GqlResponseBody<{
            contacts: ContactConnection;
          }>;
          const {
            data: {
              contacts: { totalCount, edges, pageInfo },
            },
          } = body;
          expectIsDefined(totalCount);
          expectIsDefined(edges);
          expectIsDefined(pageInfo);
          expect(edges.length).toBe(2);
          expect(totalCount).toBe(5);
          expect(edges[0].cursor).toBe(
            'eyJjLm5hbWUiOiJBQ01FIEluYy4iLCJlMC5pZCI6NDh9'
          );
          expect(edges[edges.length - 1].cursor).toBe(
            'eyJjLm5hbWUiOiJBQ01FIEluYy4iLCJlMC5pZCI6MTYwOX0='
          );
          expect(pageInfo.startCursor).toBe(edges[0].cursor);
          expect(pageInfo.endCursor).toBe(edges[edges.length - 1].cursor);
          expect(pageInfo.hasPreviousPage).toBe(false);
          expect(pageInfo.hasNextPage).toBe(true);
        });
      });
      it('can get the last 2', async () => {
        await sendGql(`{
          contacts(
            where: {
              email: { _contains: "dani" }
            },
            orderBy: {
              company: {
                name: ASC
              }
            },
            last: 2
          ) {
            totalCount,
            edges {
              cursor,
              node {
                firstName
              }
            },
            pageInfo {
              startCursor,
              endCursor,
              hasPreviousPage,
              hasNextPage
            }
          }
        }`).then((response) => {
          const body = response.body as GqlResponseBody<{
            contacts: ContactConnection;
          }>;
          const {
            data: {
              contacts: { totalCount, edges, pageInfo },
            },
          } = body;
          expectIsDefined(totalCount);
          expectIsDefined(edges);
          expectIsDefined(pageInfo);
          expect(edges.length).toBe(2);
          expect(totalCount).toBe(5);
          expect(edges[0].cursor).toBe(
            'eyJjLm5hbWUiOiJQcm9iYW5kbyIsImUwLmlkIjoxNTIyfQ=='
          );
          expect(edges[edges.length - 1].cursor).toBe(
            'eyJjLm5hbWUiOiJQcm9iYW5kbyIsImUwLmlkIjoxNTU3fQ=='
          );
          expect(pageInfo.startCursor).toBe(edges[0].cursor);
          expect(pageInfo.endCursor).toBe(edges[edges.length - 1].cursor);
          expect(pageInfo.hasPreviousPage).toBe(true);
          expect(pageInfo.hasNextPage).toBe(false);
        });
      });
      it('can get the first 2 after middle', async () => {
        await sendGql(`{
          contacts(
            where: {
              email: { _contains: "dani" }
            },
            orderBy: {
              company: {
                name: ASC
              }
            },
            first: 2,
            after: "${middleCursor}"
          ) {
            totalCount,
            edges {
              cursor,
              node {
                firstName
              }
            },
            pageInfo {
              startCursor,
              endCursor,
              hasPreviousPage,
              hasNextPage
            }
          }
        }`).then((response) => {
          const body = response.body as GqlResponseBody<{
            contacts: ContactConnection;
          }>;
          const {
            data: {
              contacts: { totalCount, edges, pageInfo },
            },
          } = body;
          expectIsDefined(totalCount);
          expectIsDefined(edges);
          expectIsDefined(pageInfo);
          expect(edges.length).toBe(2);
          expect(totalCount).toBe(5);
          expect(edges[0].cursor).toBe(
            'eyJjLm5hbWUiOiJQcm9iYW5kbyIsImUwLmlkIjoxNTIyfQ=='
          );
          expect(edges[edges.length - 1].cursor).toBe(
            'eyJjLm5hbWUiOiJQcm9iYW5kbyIsImUwLmlkIjoxNTU3fQ=='
          );
          expect(pageInfo.startCursor).toBe(edges[0].cursor);
          expect(pageInfo.endCursor).toBe(edges[edges.length - 1].cursor);
          expect(pageInfo.hasPreviousPage).toBe(true);
          expect(pageInfo.hasNextPage).toBe(false);
        });
      });
      it('can get the last 2 before middle', async () => {
        await sendGql(`{
          contacts(
            where: {
              email: { _contains: "dani" }
            },
            orderBy: {
              company: {
                name: ASC
              }
            },
            last: 2,
            before: "${middleCursor}"
          ) {
            totalCount,
            edges {
              cursor,
              node {
                firstName
              }
            },
            pageInfo {
              startCursor,
              endCursor,
              hasPreviousPage,
              hasNextPage
            }
          }
        }`).then((response) => {
          const body = response.body as GqlResponseBody<{
            contacts: ContactConnection;
          }>;
          const {
            data: {
              contacts: { totalCount, edges, pageInfo },
            },
          } = body;
          expectIsDefined(totalCount);
          expectIsDefined(edges);
          expectIsDefined(pageInfo);
          expect(edges.length).toBe(2);
          expect(totalCount).toBe(5);
          expect(edges[0].cursor).toBe(
            'eyJjLm5hbWUiOiJBQ01FIEluYy4iLCJlMC5pZCI6NDh9'
          );
          expect(edges[edges.length - 1].cursor).toBe(
            'eyJjLm5hbWUiOiJBQ01FIEluYy4iLCJlMC5pZCI6MTYwOX0='
          );
          expect(pageInfo.startCursor).toBe(edges[0].cursor);
          expect(pageInfo.endCursor).toBe(edges[edges.length - 1].cursor);
          expect(pageInfo.hasPreviousPage).toBe(false);
          expect(pageInfo.hasNextPage).toBe(true);
        });
      });
    });
    // it('can filter contacts by company name', async () => {
    //   await sendGql(`{
    //     contacts(
    //       where: {
    //         company: {
    //           name: { _eq: "ACME Inc." }
    //         }
    //       }
    //     ) {
    //       nodes {
    //         company {
    //           name
    //         }
    //       }
    //     }
    //   }`).then((response) => {
    //     const body = response.body as GqlResponseBody<{
    //       contacts: ContactConnection;
    //     }>;
    //     const {
    //       errors,
    //       data: {
    //         contacts: { nodes },
    //       },
    //     } = body;
    //     expectIsDefined(nodes);
    //     expect(errors).not.toBeDefined();
    //     expect(nodes.length).toBeGreaterThan(0);
    //     expect(nodes.every((c) => c.company?.name === 'ACME Inc.')).toEqual(
    //       true,
    //     );
    //   });
    // });
    // it('can filter contacts by name and company name', async () => {
    //   await sendGql(`{
    //     contacts(
    //       where: {
    //         firstName: { _contains: "Daniel" },
    //         company: {
    //           name: { _eq: "ACME Inc." }
    //         }
    //       }
    //     ) {
    //       nodes {
    //         firstName,
    //         company {
    //           name
    //         }
    //       }
    //     }
    //   }`).then((response) => {
    //     const body = response.body as GqlResponseBody<{
    //       contacts: ContactConnection;
    //     }>;
    //     const {
    //       errors,
    //       data: {
    //         contacts: { nodes },
    //       },
    //     } = body;
    //     expectIsDefined(nodes);
    //     expect(errors).not.toBeDefined();
    //     expect(nodes.length).toBeGreaterThan(0);
    //     expect(
    //       nodes.every(
    //         (c) =>
    //           c.firstName?.match(/Daniel/) && c.company?.name === 'ACME Inc.',
    //       ),
    //     ).toEqual(true);
    //   });
    // });
    // it('can order contacts by company name in ascending order', async () => {
    //   await sendGql(`{
    //     contacts(
    //       where: {
    //         firstName: { _contains: "Daniel" }
    //       },
    //       orderBy: {
    //         company: {
    //           name: ASC
    //         }
    //       }
    //     ) {
    //       nodes {
    //         company {
    //           name
    //         }
    //       }
    //     }
    //   }`).then((response) => {
    //     const body = response.body as GqlResponseBody<{
    //       contacts: ContactConnection;
    //     }>;
    //     const {
    //       errors,
    //       data: {
    //         contacts: { nodes },
    //       },
    //     } = body;
    //     expectIsDefined(nodes);
    //     expect(errors).not.toBeDefined();
    //     expect(nodes.length).toBeGreaterThan(0);
    //     const sorted = nodes
    //       .slice()
    //       .sort(
    //         (a, b) =>
    //           a.company?.name?.localeCompare(b.company?.name ?? '') ?? 0,
    //       );
    //     expect(nodes).toEqual(sorted);
    //   });
    // });
    // it('can order contacts by company name in descending order', async () => {
    //   await sendGql(`{
    //     contacts(
    //       where: {
    //         firstName: { _contains: "Daniel" }
    //       },
    //       orderBy: {
    //         company: {
    //           name: DESC
    //         }
    //       }
    //     ) {
    //       nodes {
    //         company {
    //           name
    //         }
    //       }
    //     }
    //   }`).then((response) => {
    //     const body = response.body as GqlResponseBody<{
    //       contacts: ContactConnection;
    //     }>;
    //     const {
    //       errors,
    //       data: {
    //         contacts: { nodes },
    //       },
    //     } = body;
    //     expectIsDefined(nodes);
    //     expect(errors).not.toBeDefined();
    //     expect(nodes.length).toBeGreaterThan(0);
    //     const sorted = nodes
    //       .slice()
    //       .sort(
    //         (a, b) =>
    //           b.company?.name?.localeCompare(a.company?.name ?? '') ?? 0,
    //       );
    //     expect(nodes).toEqual(sorted);
    //   });
    // });
  });

  describe('query one', () => {
    it('getting a non-existent contact results in a NOT_FOUND error code', async () => {
      await sendGql(`{
      contact(id: 3) {
        id, firstName
      }
    }`).then((response) => {
        const body = response.body as GqlResponseBody;
        const { errors } = body;
        expectIsDefined(errors);
        const notFoundError = errors.find(
          (error) => error.extensions.code === 'NOT_FOUND'
        );
        expect(notFoundError).toBeDefined();
      });
    });

    it('getting an existing contact returns its value', async () => {
      await sendGql(`{
      contact(id: 43) {
        id, firstName
      }
    }`).then((response) => {
        const body = response.body as GqlResponseBody<{
          contact: Contact | null;
        }>;
        const {
          errors,
          data: { contact },
        } = body;
        expect(errors).not.toBeDefined();
        expectIsDefined(contact);
        expect(contact.id).toEqual(43);
        expect(contact.firstName).toEqual('Julito Pele');
      });
    });

    it('can get fullName', async () => {
      await sendGql(`{
      contact(id: 43) {
        fullName
      }
    }`).then((response) => {
        const body = response.body as GqlResponseBody<{
          contact: Contact | null;
        }>;
        const {
          errors,
          data: { contact },
        } = body;
        expect(errors).not.toBeDefined();
        expectIsDefined(contact);
        expect(contact.fullName).toBeDefined();
      });
    });
  });

  let contactId: number;
  const newEmail = `${uuid()}@gmail.com`;

  describe('creating', () => {
    it('creating a contact works and returns the value', async () => {
      // const spy = jest.spyOn(authService, 'getPermissionsForInstitution');
      // spy.mockImplementation(() => Promise.resolve(['view-email']));
      await sendGql(`
        mutation {
          createContact(
            input: {
              firstName: "Carlos",
              lastName: "González",
              email: "${newEmail}",
              companyId: 1,
            }
          ) {
            contact {
              id,
              firstName,
              email,
              company {
                id
              }
            }
          }
        }
      `).then((response) => {
        // expect(spy).toHaveBeenCalled();
        // spy.mockRestore();
        const body = response.body as GqlResponseBody<{
          createContact: CreateContactOutput;
        }>;
        const {
          errors,
          data: { createContact },
        } = body;
        expectIsDefined(createContact);
        expect(errors).not.toBeDefined();
        const {
          contact: { id, firstName, email, company },
        } = createContact;
        expect(id).toBeDefined();
        expect(firstName).toEqual('Carlos');
        expect(email).toEqual(newEmail);
        expectIsDefined(company);
        expect(company.id).toEqual(1);
        contactId = id;
      });
    });
    it('creating a contact with an existing email results in an INPUT_VALIDATION error code', async () => {
      await sendGql(`
        mutation {
          createContact(
            input: {
              firstName: "Carlos",
              lastName: "González",
              email: "${newEmail}",
              companyId: 1
            }
          ) {
            contact {
              id
            }
          }
        }
      `).then((response) => {
        const body = response.body as GqlResponseBody<{
          createContact: CreateContactOutput;
        }>;
        const { errors, data } = body;
        expectIsDefined(errors);
        expect(data).toBeNull();
        const error = errors.find(
          (error) =>
            error.extensions.category === 'BUSINESS_RULE' &&
            error.extensions.code === 'EMAIL_EXISTS'
        );
        expectIsDefined(error);
      });
    });
  });

  describe('updating', () => {
    it("can update a contact's company", async () => {
      const spy = jest.spyOn(
        permissionsService,
        'getPermissionsForInstitution'
      );
      spy.mockImplementation(() => Promise.resolve(['view-email']));
      await sendGql(`
        mutation {
          updateContact(
            input: {
              contactId: 43,
              companyId: 2
            }
          ) {
            contact {
              company {
                id
              }
            }
          }
        }
      `).then((response) => {
        spy.mockRestore();
        const body = response.body as GqlResponseBody<{
          updateContact: UpdateContactOutput;
        } | null>;
        const { data } = body;
        expectIsDefined(data);
        expectIsDefined(data.updateContact.contact.company);
        expect(data.updateContact.contact.company.id).toEqual(2);
      });
    });
    it('updating a contact to have an existing email results in a BUSINESS_RULE error', async () => {
      const spy = jest.spyOn(
        permissionsService,
        'getPermissionsForInstitution'
      );
      spy.mockImplementation(() => Promise.resolve(['view-email']));
      await sendGql(`
        mutation {
          updateContact(
            input: {
              contactId: 43,
              email: "${newEmail}"
            }
          ) {
            contact {
              firstName,
              email
            }
          }
        }
      `).then((response) => {
        spy.mockRestore();
        const body = response.body as GqlResponseBody<{
          updateContact: UpdateContactOutput;
        } | null>;
        const { errors, data } = body;
        expectIsDefined(errors);
        expect(data).toBeNull();
        const error = errors.find(
          (error) =>
            error.extensions.category === 'BUSINESS_RULE' &&
            error.extensions.code === 'EMAIL_EXISTS'
        );
        expectIsDefined(error);
      });
    });

    it("updating a contact to have an existing email works if it's their own email", async () => {
      const spy = jest.spyOn(
        permissionsService,
        'getPermissionsForInstitution'
      );
      spy.mockImplementation(() => Promise.resolve(['view-email']));
      await sendGql(`
        mutation {
          updateContact(
            input: {
              contactId: ${contactId},
              email: "${newEmail}"
            }
          ) {
            contact {
              firstName,
              email
            }
          }
        }
      `).then((response) => {
        spy.mockRestore();
        const body = response.body as GqlResponseBody<{
          updateContact: UpdateContactOutput;
        }>;
        const {
          errors,
          data: { updateContact },
        } = body;
        expectIsDefined(updateContact);
        expect(errors).not.toBeDefined();
        const {
          contact: { firstName, email },
        } = updateContact;
        expect(firstName).toEqual('Carlos');
        expect(email).toEqual(newEmail);
      });
    });

    it("updating a contact's email works", async () => {
      // const spy = jest.spyOn(authService, 'getPermissionsForInstitution');
      // spy.mockImplementation(() => Promise.resolve(['view-email']));
      const newNewEmail = `${uuid()}@gmail.com`;
      await sendGql(`
        mutation {
          updateContact(
            input: {
              contactId: ${contactId},
              email: "${newNewEmail}"
            }
          ) {
            contact {
              firstName,
              email
            }
          }
        }
      `).then((response) => {
        // expect(spy).toHaveBeenCalled();
        // spy.mockRestore();
        const body = response.body as GqlResponseBody<{
          updateContact: UpdateContactOutput;
        }>;
        const {
          errors,
          data: { updateContact },
        } = body;
        expectIsDefined(updateContact);
        expect(errors).not.toBeDefined();
        const {
          contact: { firstName, email: updatedEmail },
        } = updateContact;
        expect(firstName).toEqual('Carlos');
        expect(newEmail).not.toEqual(newNewEmail);
        expect(updatedEmail).toEqual(newNewEmail);
      });
    });
  });
});
