import { fromEnv } from '@leadgogo/backend-utils';

export const configuration = () =>
  fromEnv((env) => ({
    databaseUrl: env.DATABASE_URL,
    redisUrl: env.REDIS_URL,
    authenticationSalt: env.AUTHENTICATION_SALT,
    jwtSecretKey: env.JWT_SECRET_KEY,
    sessionTokenLifetime: parseInt(env.SESSION_TOKEN_LIFETIME),
  }));

export type Configuration = ReturnType<typeof configuration>;
