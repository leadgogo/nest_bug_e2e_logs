import {
  EntityManager,
  EventArgs,
  EventSubscriber,
  TransactionEventArgs,
} from '@mikro-orm/core';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class BaseSubscriber<T = any> implements EventSubscriber<T> {
  private pendingActions = new Map<
    EntityManager,
    (() => void | Promise<void>)[]
  >();

  // eslint-disable-next-line @typescript-eslint/require-await
  async afterTransactionStart(args: TransactionEventArgs) {
    const { em } = args;
    this.pendingActions.set(em, []);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async afterCreate(args: EventArgs<T>) {
    const { em } = args;
    this.pendingActions.get(em)?.push(() => this.afterCommitCreate(args));
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async afterUpdate(args: EventArgs<T>) {
    const { em } = args;
    this.pendingActions.get(em)?.push(() => this.afterCommitUpdate(args));
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async afterDelete(args: EventArgs<T>) {
    const { em } = args;
    this.pendingActions.get(em)?.push(() => this.afterCommitDelete(args));
  }

  async afterTransactionCommit(args: TransactionEventArgs) {
    const { em } = args;
    const actions = this.pendingActions.get(em);
    if (actions) {
      try {
        await Promise.all(actions.map((a) => a()));
      } finally {
        this.pendingActions.delete(em);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async afterTransactionRollback(args: TransactionEventArgs) {
    const { em } = args;
    this.pendingActions.delete(em);
  }

  afterCommitCreate(args: EventArgs<T>): void | Promise<void> {}

  afterCommitUpdate(args: EventArgs<T>): void | Promise<void> {}

  afterCommitDelete(args: EventArgs<T>): void | Promise<void> {}
}
