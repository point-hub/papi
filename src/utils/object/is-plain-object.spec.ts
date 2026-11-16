import { describe, expect, it } from 'bun:test';

import isPlainObject from './is-plain-object';

describe('isPlainObject', () => {
  it('returns true for plain objects', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ name: 'John' })).toBe(true);
    expect(isPlainObject(Object.create(null))).toBe(true);
  });

  it('returns false for non-object values', () => {
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject(undefined)).toBe(false);
    expect(isPlainObject('string')).toBe(false);
    expect(isPlainObject(123)).toBe(false);
    expect(isPlainObject(true)).toBe(false);
  });

  it('returns false for arrays', () => {
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject([1, 2, 3])).toBe(false);
  });

  it('returns false for dates', () => {
    expect(isPlainObject(new Date())).toBe(false);
  });

  it('returns false for class instances', () => {
    class User {
      name = 'John';
    }

    expect(isPlainObject(new User())).toBe(false);
  });
});
