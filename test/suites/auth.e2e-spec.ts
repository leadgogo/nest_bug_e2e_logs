import '@leadgogo/e2e-helpers/dist/enhance-supertest';
import { TestingModule, Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import supertest from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/configure-app';
import { Configuration } from 'src/config/all.config';

describe('auth', () => {
  let app: INestApplication;
  let request: supertest.SuperTest<supertest.Test>;
  let configService: ConfigService<Configuration>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    configService = moduleFixture.get(ConfigService);
    request = supertest(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  let jwt: string;

  it('logging in with wrong credentials emits a 401', async () => {
    await request
      .post('/v1/auth/login')
      .set('accept-language', 'en')
      .send({
        username: 'admin',
        password: 'hunter2',
      })
      .expect(401)
      .then((res) => {
        expect(res.body.message).toBe('Wrong credentials.');
      });
  });
  it('logging in with correct credentials emits a 200 and response contains a token', async () => {
    await request
      .post('/v1/auth/login')
      .set('accept-language', 'en')
      .send({
        username: 'admin',
        password: 'admin1234',
      })
      .expect(200)
      .then((response) => {
        expect(response.body).toHaveProperty('token');
        jwt = response.body.token;
      });
  });
  it('logging out works', async () => {
    await request
      .get('/v1/auth/logout')
      .set('accept-language', 'en')
      .set('authorization', `Bearer ${jwt}`)
      .expect(200)
      .then((res) => {
        expect(res.body).toEqual({});
      });
    await request
      .post('/v1/graphql')
      .set('accept-language', 'en')
      .set('authorization', `Bearer ${jwt}`)
      .send({
        query: `{
          contacts(
            first: 1
          ) {
            nodes {
              id, firstName
            }
          }
        }`,
      })
      .expect(401)
      .then((res) => {
        expect(res.body.message).toBe('Session not found.');
      });
  });
  describe('accessing a protected endpoint', () => {
    beforeAll(async () => {
      await request
        .post('/v1/auth/login')
        .set('accept-language', 'en')
        .send({
          username: 'admin',
          password: 'admin1234',
        })
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('token');
          jwt = response.body.token;
        });
    });
    it('without providing a valid jwt emits a 401', async () => {
      await request
        .post('/v1/graphql')
        .set('accept-language', 'en')
        .send({
          query: `{
            contacts(
              first: 1
            ) {
              nodes {
                id, firstName
              }
            }
          }`,
        })
        .expect(401)
        .then((res) => {
          expect(res.body.message).toBe('Auth token not present.');
        });
    });
    it('while providing a valid jwt emits a 200', async () => {
      await request
        .post('/v1/graphql')
        .set('accept-language', 'en')
        .set('authorization', `Bearer ${jwt}`)
        .send({
          query: `{
            contacts(
              first: 1
            ) {
              nodes {
                id, firstName
              }
            }
          }`,
        })
        .expect(200);
    });
    it('while providing an expired jwt emits a 401', async () => {
      const originalGet = configService.get.bind(configService);
      const spy = jest.spyOn(configService, 'get').mockImplementationOnce((key) => {
        if (key === 'sessionTokenLifetime') {
          return 0;
        }
        return originalGet(key);
      });
      await request
        .post('/v1/graphql')
        .set('accept-language', 'en')
        .set('authorization', `Bearer ${jwt}`)
        .send({
          query: `{
            contacts {
              nodes {
                id, firstName
              }
            }
          }`,
        })
        .expect(401)
        .then((res) => {
          expect(res.body.message).toBe('Session expired.');
        });
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
