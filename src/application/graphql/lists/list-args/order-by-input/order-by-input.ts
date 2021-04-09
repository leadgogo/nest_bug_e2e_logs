import { Field, InputType } from '@nestjs/graphql';
import { OrderDirection } from 'src/application/graphql/enums/order-direction.enum';
import { ListArgsConfig } from 'src/application/graphql/lists/list-args/list-args-config.interface';
import {
  listArgsByClassName,
  scalarOrObjectOrderByInputTypesByClassName,
} from 'src/application/graphql/lists/list-args/metadata';

export function ObjectOrderByInput(entityType: Function | string) {
  const entityName =
    typeof entityType === 'function' ? entityType.name : entityType;
  const listArgsProperties: ListArgsConfig[] = listArgsByClassName[entityName];
  if (
    !listArgsProperties ||
    listArgsProperties.filter((config) => config.includeInOrderBy).length === 0
  ) {
    throw new Error(`No order by input handler found for ${entityName}`);
  }

  const clsName = `Base${entityName}OrderByInput`;
  const container = {
    [clsName]: class {},
  };
  const baseOrderByCls = container[clsName];

  for (const config of listArgsProperties) {
    const { propertyName, type } = config;
    if (config.includeInOrderBy) {
      const fieldOrderByInputType = getOrderByInputType(type);
      if (fieldOrderByInputType) {
        Field(() => fieldOrderByInputType, { nullable: true })(
          baseOrderByCls.prototype,
          propertyName
        );
      }
    }
  }

  InputType()(baseOrderByCls);

  return baseOrderByCls;
}

function registerObjectOrderByInputType(
  getEntityType: (() => Function) | string,
  cls: Function | object
) {
  const entityName =
    typeof getEntityType === 'function' ? getEntityType().name : getEntityType;
  if (entityName in scalarOrObjectOrderByInputTypesByClassName) {
    throw new Error(
      `${entityName} already in scalarOrObjectOrderByInputTypesByClassName`
    );
  }
  scalarOrObjectOrderByInputTypesByClassName[entityName] = cls;
}

export function ObjectOrderByInputType(
  getEntityType: (() => Function) | string,
  register = true
): ClassDecorator {
  return function (cls: Function) {
    if (register) {
      registerObjectOrderByInputType(getEntityType, cls);
    }
    InputType()(cls);
  };
}

export function getOrderByInputType(
  entityType: Function | Function[] | string | string[]
) {
  if (Array.isArray(entityType)) {
    return null;
  }
  const entityName =
    typeof entityType === 'function' ? entityType.name : entityType;
  const handler: Function | object =
    scalarOrObjectOrderByInputTypesByClassName[entityName];
  if (handler) {
    return handler;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } else if ([String, Number, Boolean].includes(entityType as any)) {
    registerObjectOrderByInputType(entityName, OrderDirection);
    return OrderDirection;
  } else {
    const clsName = `${entityName}OrderByInput`;
    const container = {
      [clsName]: class {},
    };
    const orderByCls = container[clsName];
    registerObjectOrderByInputType(entityName, orderByCls);
    const baseOrderByCls = ObjectOrderByInput(entityType);
    Object.setPrototypeOf(orderByCls, baseOrderByCls);
    ObjectOrderByInputType(entityName, false)(orderByCls);
    return orderByCls;
  }
}
