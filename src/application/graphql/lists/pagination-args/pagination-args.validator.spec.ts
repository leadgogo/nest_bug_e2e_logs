import { PaginationArgumentsApiError } from '../../../errors/api-error/pagination.api-error';
import { PaginationArgs } from './pagination.args';
import { paginationArgsValidator } from './pagination-args.validator';

describe('Pagination Args Validator', () => {
  it('accepts missing limit', () => {
    const args: PaginationArgs = {};
    expect(() => paginationArgsValidator(args)).not.toThrow();
    expect(paginationArgsValidator(args)).toHaveProperty('first', 200);
  });
  it('rejects both directions', () => {
    expect.assertions(2);
    const args: PaginationArgs = {
      first: 1,
      last: 2,
    };
    try {
      paginationArgsValidator(args);
    } catch (error) {
      expect(error).toBeInstanceOf(PaginationArgumentsApiError);
      expect(error.code).toBe('BOTH_DIRECTIONS');
    }
  });
  it('rejects invalid argument combination when direction is forward', () => {
    expect.assertions(2);
    const args: PaginationArgs = {
      first: 1,
      before: 'sds',
    };
    try {
      paginationArgsValidator(args);
    } catch (error) {
      expect(error).toBeInstanceOf(PaginationArgumentsApiError);
      expect(error.code).toBe('INVALID_ARGUMENT_COMBINATION');
    }
  });
  it('rejects invalid argument combination when direction is backward', () => {
    expect.assertions(2);
    const args: PaginationArgs = {
      last: 1,
      after: 'sds',
    };
    try {
      paginationArgsValidator(args);
    } catch (error) {
      expect(error).toBeInstanceOf(PaginationArgumentsApiError);
      expect(error.code).toBe('INVALID_ARGUMENT_COMBINATION');
    }
  });
  it('passes with a valid forward configuration', () => {
    const args: PaginationArgs = {
      first: 2,
      after: 'sds',
    };
    expect(() => paginationArgsValidator(args)).not.toThrow();
  });
  it('passes with another valid forward configuration', () => {
    const args: PaginationArgs = {
      first: 2,
    };
    expect(() => paginationArgsValidator(args)).not.toThrow();
  });
  it('passes with a valid backward configuration', () => {
    const args: PaginationArgs = {
      last: 2,
      before: 'sds',
    };
    expect(() => paginationArgsValidator(args)).not.toThrow();
  });
  it('passes with another valid backward configuration', () => {
    const args: PaginationArgs = {
      last: 2,
    };
    expect(() => paginationArgsValidator(args)).not.toThrow();
  });
});
