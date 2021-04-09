// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class DomainEvent<T extends Object = any> {
  constructor(public readonly entity: T) {}
}
