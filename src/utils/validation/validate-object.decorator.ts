export interface Validator<T> {
  (value: T): T | void | Promise<T | void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validatorMap = new Map<Function, Validator<any>>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ValidateObject: <T = any>(
  validator: Validator<T>
) => ClassDecorator = (fn) => {
  return (target) => {
    validatorMap.set(target, fn);
  };
};
