/* eslint-disable */
import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';

export function makeSendGql(app: INestApplication, jwt: string) {
  const request = supertest(app.getHttpServer());

  return function (
    gql: string,
    options?: { headers?: Record<string, string> }
  ) {
    const fn = request
      .post('/v1/graphql')
      .set('authorization', `Bearer ${jwt}`)
      .set('accept-language', 'en_US');

    if (options?.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        fn.set(key, value);
      }
    }

    return fn
      .send({
        query: gql,
      })
      .expect(200);
  };
}
