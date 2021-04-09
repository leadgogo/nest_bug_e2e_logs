export class BaseApiError extends Error {
  code: string;
  category?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  detail?: any;

  constructor({
    code,
    category = 'UNKNOWN',
    message,
    detail,
  }: {
    code: string;
    category?: string;
    message?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    detail?: any;
  }) {
    super(message);
    this.code = code;
    this.category = category;
    this.detail = detail;
  }
}
