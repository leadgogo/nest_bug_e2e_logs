import { assertIsDefined } from '@leadgogo/backend-utils';
import { ListArgsConfig } from './list-args-config.interface';
import { listArgsByClassName } from './metadata';

interface ListArgOptions {
  includeInWhere?: boolean;
  includeInOrderBy?: boolean;
}

type GetTypeParam = (() => Function | Function[]) | string | string[];

export function ListArg(
  getType: GetTypeParam,
  options?: ListArgOptions
): PropertyDecorator;
export function ListArg(options?: ListArgOptions): PropertyDecorator;
export function ListArg(
  getTypeOrOptions?: GetTypeParam | ListArgOptions,
  options?: ListArgOptions
): PropertyDecorator {
  let getType: GetTypeParam | null;
  let finalOptions: ListArgOptions;
  if (arguments.length === 0) {
    getType = null;
    finalOptions = {};
  } else if (arguments.length < 2) {
    if (
      typeof getTypeOrOptions === 'function' ||
      typeof getTypeOrOptions === 'string' ||
      Array.isArray(getTypeOrOptions)
    ) {
      getType = getTypeOrOptions;
      finalOptions = {};
    } else {
      getType = null;
      assertIsDefined(getTypeOrOptions);
      finalOptions = getTypeOrOptions;
    }
  } else {
    getType = getTypeOrOptions as GetTypeParam;
    assertIsDefined(options);
    finalOptions = options;
  }
  const { includeInWhere = true, includeInOrderBy = true } = finalOptions;
  return function (prototype: Object, propertyName: string | symbol) {
    const entityName = prototype.constructor.name;
    if (!(entityName in listArgsByClassName)) {
      listArgsByClassName[entityName] = [];
    }
    const listArgsProperties: ListArgsConfig[] =
      listArgsByClassName[entityName];
    const type: Function | Function[] | string | string[] = getType
      ? typeof getType === 'function'
        ? getType()
        : getType
      : Reflect.getMetadata('design:type', prototype, propertyName);
    if (type === null || typeof type === 'undefined' || type === Object) {
      throw new Error(`Cannot infer where input type for ${entityName}`);
    }
    listArgsProperties.push({
      propertyName,
      type,
      includeInWhere,
      includeInOrderBy,
    });
  };
}
