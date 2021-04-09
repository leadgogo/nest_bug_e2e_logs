import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Args, GqlExecutionContext } from '@nestjs/graphql';

export function LocaleArg(): ParameterDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {
    Args('locale', { type: () => String, nullable: true })(
      target,
      propertyKey,
      -1 // we just want to register the arg for schema generation, but not let nestjs inject the value in the parameter
    );
    createParamDecorator((param: never, ctx: ExecutionContext) => {
      const gqlCtx = GqlExecutionContext.create(ctx).getContext();
      const contextLocale: string = gqlCtx.locale;
      const argLocale = ctx.getArgByIndex(1)['locale'] as string;
      const locale = argLocale ?? contextLocale;
      return locale;
    })()(target, propertyKey, parameterIndex);
  };
}
