import '@leadgogo/e2e-helpers/dist/enhance-supertest';
import { INestApplication, Injectable } from '@nestjs/common';
import supertest from 'supertest';
import { v4 as uuid } from 'uuid';
import { makeSendGql } from 'test/utils/make-send-sql';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { configureApp } from 'src/configure-app';
import { DomainEventHandler } from 'src/domain/utils/domain-events/domain-event-handler.interface';
import { ContactCreatedEvent } from 'src/domain/contact/domain-events/contact-created.event';
import { OnDomainEvent } from 'src/domain/utils/domain-events/on-domain-event.decorator';
import { expectIsDefined } from 'test/utils/assertions';
import { GqlResponseBody } from 'test/types/gql-response-body';
import { CreateContactOutput } from 'src/domain/contact/outputs/create-contact.output';
import { DomainEvent } from 'src/domain/utils/domain-events/domain-event';
import { Contact } from 'src/domain/contact/contact.entity';
import { DomainEventService } from 'src/domain/utils/domain-events/domain-event.service';
import { IntegrationEventService } from 'src/domain/utils/integration-events/integration-event.service';
import { IntegrationEventRepository } from 'src/domain/utils/integration-events/integration-event.repository';

class FooEvent extends DomainEvent<Contact> {}

@OnDomainEvent(FooEvent)
class FooEventHandler implements DomainEventHandler {
  constructor(private integrationEventService: IntegrationEventService) {}

  async handle(event: ContactCreatedEvent) {
    this.integrationEventService.create('foo-event' as any, {
      email: event.entity.email,
    });
  }
}

@Injectable()
@OnDomainEvent(ContactCreatedEvent)
class FooGeneratorHandler implements DomainEventHandler {
  constructor(private domainEventService: DomainEventService) {}

  handle(event: ContactCreatedEvent) {
    const { entity } = event;
    this.domainEventService.put(new FooEvent(entity));
  }
}

describe('domain events', () => {
  let app: INestApplication;
  let request: supertest.SuperTest<supertest.Test>;
  let sendGql: ReturnType<typeof makeSendGql>;
  let integrationEventRepository: IntegrationEventRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [FooGeneratorHandler, FooEventHandler],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    integrationEventRepository = await moduleFixture.resolve(IntegrationEventRepository);

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

  it('integration events work', async () => {
    const newEmail = `${uuid()}@gmail.com`;
    await sendGql(`
      mutation {
        createContact(
          input: {
            firstName: "Test",
            lastName: "Subject",
            email: "${newEmail}",
            companyId: 1,
          }
        ) {
          contact {
            id, firstName, email
          }
        }
      }
    `).then(async (response) => {
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
        contact: { id, firstName, email },
      } = createContact;
      expect(id).toBeDefined();
      expect(firstName).toEqual('Test');
      expect(email).toEqual(newEmail);
      const integrationEvents = await integrationEventRepository.find({});
      const found = integrationEvents.find((e) => e.payload.email === newEmail);
      expect(found).toBeDefined();
    });
  });
});
