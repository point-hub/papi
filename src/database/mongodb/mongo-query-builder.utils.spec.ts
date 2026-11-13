import { describe, expect, it } from 'bun:test';
import { ObjectId } from 'mongodb';

import {
  addBooleanFilter,
  addDateRangeFilter,
  addExactFilter,
  addNumberFilter,
  addObjectIdFilter,
  addRegexFilter,
  buildUpdateData,
  calculateSkip,
  createProjection,
  createSort,
  excludeFields,
  fromObjectIds,
  IFieldsObject,
  isPlainObject,
  parseBoolean,
  parseComparisons,
  parseFieldList,
  parsePage,
  parsePageSize,
  parseProjection,
  parseSort,
  toObjectIds,
} from './mongo-query-builder.utils';

describe('MongoQueryBuilder', () => {
  describe('parsePage', () => {
    it('parses a valid page number', () => {
      expect(parsePage('10')).toBe(10);
      expect(parsePage(10)).toBe(10);
    });

    it('returns 1 for invalid values', () => {
      expect(parsePage('abc')).toBe(1);
      expect(parsePage(0)).toBe(1);
      expect(parsePage(-1)).toBe(1);
      expect(parsePage(NaN)).toBe(1);
      expect(parsePage(Infinity)).toBe(1);
    });

    it('defaults to page 1', () => {
      expect(parsePage()).toBe(1);
    });
  });

  describe('parsePageSize', () => {
    it('parses a valid page size', () => {
      expect(parsePageSize('20')).toBe(20);
      expect(parsePageSize(20)).toBe(20);
    });

    it('returns 10 for invalid values', () => {
      expect(parsePageSize('abc')).toBe(10);
      expect(parsePageSize(0)).toBe(10);
      expect(parsePageSize(-1)).toBe(10);
      expect(parsePageSize(NaN)).toBe(10);
      expect(parsePageSize(Infinity)).toBe(10);
    });

    it('defaults to page size 10', () => {
      expect(parsePageSize()).toBe(10);
    });
  });

  describe('calculateSkip', () => {
    it('calculates the number of records to skip', () => {
      expect(calculateSkip(1, 10)).toBe(0);
      expect(calculateSkip(2, 10)).toBe(10);
      expect(calculateSkip(3, 10)).toBe(20);
      expect(calculateSkip('5', '20')).toBe(80);
    });

    it('uses default values for invalid inputs', () => {
      expect(calculateSkip(0, 10)).toBe(0);
      expect(calculateSkip(2, 0)).toBe(10);
    });
  });

  describe('parseProjection', () => {
    it('parses included fields', () => {
      expect(parseProjection('name, address')).toEqual({
        name: 1,
        address: 1,
      });
    });

    it('supports space-separated fields', () => {
      expect(parseProjection('name address email')).toEqual({
        name: 1,
        address: 1,
        email: 1,
      });
    });

    it('parses excluded fields', () => {
      expect(parseProjection('', ['password', 'token'])).toEqual({
        password: 0,
        token: 0,
      });
    });

    it('allows excluding _id alongside included fields', () => {
      expect(parseProjection('name, address', ['_id'])).toEqual({
        name: 1,
        address: 1,
        _id: 0,
      });
    });

    it('throws when mixing included and excluded fields', () => {
      expect(() => parseProjection('name', ['password'])).toThrow(
        'Cannot mix inclusion and exclusion fields in MongoDB projection',
      );
    });

    it('returns an empty object when no fields are provided', () => {
      expect(parseProjection()).toEqual({});
      expect(parseProjection('', [])).toEqual({});
    });

    it('ignores empty field names', () => {
      expect(parseProjection('name, , address')).toEqual({
        name: 1,
        address: 1,
      });
    });
  });

  describe('parseFieldList', () => {
    it('parses comma-separated fields', () => {
      expect(parseFieldList('name, address, email')).toEqual([
        'name',
        'address',
        'email',
      ]);
    });

    it('parses space-separated fields', () => {
      expect(parseFieldList('name address email')).toEqual([
        'name',
        'address',
        'email',
      ]);
    });

    it('trims whitespace and ignores empty fields', () => {
      expect(parseFieldList(' name, , address ')).toEqual([
        'name',
        'address',
      ]);
    });

    it('returns an empty array for an empty string', () => {
      expect(parseFieldList('')).toEqual([]);
    });
  });

  describe('createProjection', () => {
    it('creates an inclusion projection', () => {
      expect(createProjection(['name', 'email'])).toEqual({
        name: 1,
        email: 1,
      });
    });

    it('creates an exclusion projection', () => {
      expect(createProjection(['password', 'token'], 0)).toEqual({
        password: 0,
        token: 0,
      });
    });

    it('ignores empty field names', () => {
      expect(createProjection(['name', '', '  ', 'email'])).toEqual({
        name: 1,
        email: 1,
      });
    });

    it('returns an empty object for an empty array', () => {
      expect(createProjection([])).toEqual({});
    });
  });

  describe('createSort', () => {
    it('creates an ascending sort', () => {
      expect(createSort(['name', 'email'])).toEqual({
        name: 1,
        email: 1,
      });
    });

    it('creates a descending sort', () => {
      expect(createSort(['-created_at', '-updated_at'])).toEqual({
        created_at: -1,
        updated_at: -1,
      });
    });

    it('supports mixed sort directions', () => {
      expect(createSort(['-created_at', 'name'])).toEqual({
        created_at: -1,
        name: 1,
      });
    });

    it('ignores empty field names', () => {
      expect(createSort(['name', '', '  '])).toEqual({
        name: 1,
      });
    });

    it('returns an empty object for an empty array', () => {
      expect(createSort([])).toEqual({});
    });
  });

  describe('excludeFields', () => {
    it('excludes specified fields from a projection', () => {
      const projection = {
        name: 1,
        email: 1,
      };

      const result = excludeFields(projection, ['email']);

      expect(result).toEqual({
        name: 1,
        email: 0,
      });
    });

    it('adds excluded fields that do not exist in the projection', () => {
      expect(excludeFields({ name: 1 }, ['_id'])).toEqual({
        name: 1,
        _id: 0,
      });
    });

    it('modifies and returns the original projection object', () => {
      const projection: IFieldsObject = { name: 1 };

      const result = excludeFields(projection, ['password']);

      expect(result).toBe(projection);
      expect(projection).toEqual({
        name: 1,
        password: 0,
      });
    });

    it('ignores empty field names', () => {
      expect(excludeFields({ name: 1 }, ['', '  '])).toEqual({
        name: 1,
      });
    });
  });

  describe('parseSort', () => {
    it('parses ascending and descending fields', () => {
      expect(parseSort('name, -created_at')).toEqual({
        name: 1,
        created_at: -1,
      });
    });

    it('supports different field separators', () => {
      expect(parseSort('name email -created_at')).toEqual({
        name: 1,
        email: 1,
        created_at: -1,
      });
    });

    it('returns an empty object for an empty string', () => {
      expect(parseSort('')).toEqual({});
    });
  });

  describe('addRegexFilter', () => {
    it('adds a case-insensitive regex filter', () => {
      const filters: Record<string, unknown>[] = [];

      addRegexFilter(filters, 'name', 'john');

      expect(filters).toEqual([
        {
          name: {
            $regex: 'john',
            $options: 'i',
          },
        },
      ]);
    });

    it('trims the search value', () => {
      const filters: Record<string, unknown>[] = [];

      addRegexFilter(filters, 'name', ' john ');

      expect(filters).toEqual([
        {
          name: {
            $regex: 'john',
            $options: 'i',
          },
        },
      ]);
    });

    it('does not add a filter for empty values', () => {
      const filters: Record<string, unknown>[] = [];

      addRegexFilter(filters, 'name', '');
      addRegexFilter(filters, 'name', '   ');
      addRegexFilter(filters, 'name');

      expect(filters).toEqual([]);
    });
  });


  describe('addExactFilter', () => {
    it('adds a filter with a string value', () => {
      const filters: Record<string, unknown>[] = [];

      addExactFilter(filters, 'name', 'John');

      expect(filters).toEqual([{ name: 'John' }]);
    });

    it('trims string values before adding the filter', () => {
      const filters: Record<string, unknown>[] = [];

      addExactFilter(filters, 'name', '  John  ');

      expect(filters).toEqual([{ name: 'John' }]);
    });

    it('adds a filter with a non-string value', () => {
      const filters: Record<string, unknown>[] = [];

      addExactFilter(filters, 'age', 25);

      expect(filters).toEqual([{ age: 25 }]);
    });

    it('adds false and zero values', () => {
      const filters: Record<string, unknown>[] = [];

      addExactFilter(filters, 'is_active', false);
      addExactFilter(filters, 'count', 0);

      expect(filters).toEqual([
        { is_active: false },
        { count: 0 },
      ]);
    });

    it('does not add a filter when the value is undefined', () => {
      const filters: Record<string, unknown>[] = [];

      addExactFilter(filters, 'name', undefined);

      expect(filters).toEqual([]);
    });

    it('does not add a filter when the value is null', () => {
      const filters: Record<string, unknown>[] = [];

      addExactFilter(filters, 'name', null);

      expect(filters).toEqual([]);
    });

    it('does not add a filter when the string is empty', () => {
      const filters: Record<string, unknown>[] = [];

      addExactFilter(filters, 'name', '');

      expect(filters).toEqual([]);
    });

    it('does not add a filter when the string contains only whitespace', () => {
      const filters: Record<string, unknown>[] = [];

      addExactFilter(filters, 'name', '   ');

      expect(filters).toEqual([]);
    });
  });

  describe('addObjectIdFilter', () => {
    it('adds a filter with a valid ObjectId', () => {
      const filters: Record<string, unknown>[] = [];
      const id = new ObjectId();

      addObjectIdFilter(filters, 'user_id', id.toHexString());

      expect(filters).toEqual([
        { user_id: id },
      ]);
    });

    it('trims the ObjectId string before validation', () => {
      const filters: Record<string, unknown>[] = [];
      const id = new ObjectId();

      addObjectIdFilter(filters, 'user_id', `  ${id.toHexString()}  `);

      expect(filters).toEqual([
        { user_id: id },
      ]);
    });

    it('does not add a filter when the ObjectId is invalid', () => {
      const filters: Record<string, unknown>[] = [];

      addObjectIdFilter(filters, 'user_id', 'invalid-id');

      expect(filters).toEqual([]);
    });

    it('does not add a filter when the value is empty', () => {
      const filters: Record<string, unknown>[] = [];

      addObjectIdFilter(filters, 'user_id', '');

      expect(filters).toEqual([]);
    });

    it('does not add a filter when the value contains only whitespace', () => {
      const filters: Record<string, unknown>[] = [];

      addObjectIdFilter(filters, 'user_id', '   ');

      expect(filters).toEqual([]);
    });

    it('does not add a filter when the value is undefined', () => {
      const filters: Record<string, unknown>[] = [];

      addObjectIdFilter(filters, 'user_id', undefined);

      expect(filters).toEqual([]);
    });
  });

  describe('parseBoolean', () => {
    it('parses boolean values', () => {
      expect(parseBoolean(true)).toBe(true);
      expect(parseBoolean(false)).toBe(false);
    });

    it('parses boolean strings', () => {
      expect(parseBoolean('true')).toBe(true);
      expect(parseBoolean('false')).toBe(false);
    });

    it('returns undefined for invalid values', () => {
      expect(parseBoolean('invalid')).toBeUndefined();
      expect(parseBoolean('TRUE')).toBeUndefined();
      expect(parseBoolean('False')).toBeUndefined();
      expect(parseBoolean('')).toBeUndefined();
      expect(parseBoolean()).toBeUndefined();
    });
  });

  describe('addBooleanFilter', () => {
    it('adds a true boolean filter', () => {
      const filters: Record<string, unknown>[] = [];

      addBooleanFilter(filters, 'is_active', 'true');

      expect(filters).toEqual([
        { is_active: true },
      ]);
    });

    it('adds a false boolean filter', () => {
      const filters: Record<string, unknown>[] = [];

      addBooleanFilter(filters, 'is_active', false);

      expect(filters).toEqual([
        { is_active: false },
      ]);
    });

    it('does not add a filter for invalid values', () => {
      const filters: Record<string, unknown>[] = [];

      addBooleanFilter(filters, 'is_active', 'invalid');
      addBooleanFilter(filters, 'is_active', '');

      expect(filters).toEqual([]);
    });

    it('does not add a filter for undefined', () => {
      const filters: Record<string, unknown>[] = [];

      addBooleanFilter(filters, 'is_active');

      expect(filters).toEqual([]);
    });
  });

  describe('addDateRangeFilter', () => {
    it('adds a date range filter', () => {
      const filters: Record<string, unknown>[] = [];

      addDateRangeFilter(
        filters,
        'created_at',
        '2026-01-01',
        '2026-12-31',
      );

      expect(filters).toEqual([
        {
          created_at: {
            $gte: new Date('2026-01-01'),
            $lte: new Date('2026-12-31'),
          },
        },
      ]);
    });

    it('adds only a lower-bound filter', () => {
      const filters: Record<string, unknown>[] = [];

      addDateRangeFilter(filters, 'created_at', '2026-01-01');

      expect(filters).toEqual([
        {
          created_at: {
            $gte: new Date('2026-01-01'),
          },
        },
      ]);
    });

    it('adds only an upper-bound filter', () => {
      const filters: Record<string, unknown>[] = [];

      addDateRangeFilter(
        filters,
        'created_at',
        undefined,
        '2026-12-31',
      );

      expect(filters).toEqual([
        {
          created_at: {
            $lte: new Date('2026-12-31'),
          },
        },
      ]);
    });

    it('does not add a filter for empty values', () => {
      const filters: Record<string, unknown>[] = [];

      addDateRangeFilter(filters, 'created_at');
      addDateRangeFilter(filters, 'created_at', '', '  ');

      expect(filters).toEqual([]);
    });
  });

  describe('addNumberFilter', () => {
    it('adds an equality filter', () => {
      const filters: Record<string, unknown>[] = [];

      addNumberFilter(filters, 'age', '25');

      expect(filters).toEqual([
        { age: 25 },
      ]);
    });

    it('adds greater-than filters', () => {
      const filters: Record<string, unknown>[] = [];

      addNumberFilter(filters, 'age', '>18');

      expect(filters).toEqual([
        { age: { $gt: 18 } },
      ]);
    });

    it('adds greater-than-or-equal filters', () => {
      const filters: Record<string, unknown>[] = [];

      addNumberFilter(filters, 'age', '>=18');

      expect(filters).toEqual([
        { age: { $gte: 18 } },
      ]);
    });

    it('adds less-than filters', () => {
      const filters: Record<string, unknown>[] = [];

      addNumberFilter(filters, 'age', '<65');

      expect(filters).toEqual([
        { age: { $lt: 65 } },
      ]);
    });

    it('adds less-than-or-equal filters', () => {
      const filters: Record<string, unknown>[] = [];

      addNumberFilter(filters, 'age', '<=65');

      expect(filters).toEqual([
        { age: { $lte: 65 } },
      ]);
    });

    it('supports combined comparison operators', () => {
      const filters: Record<string, unknown>[] = [];

      addNumberFilter(filters, 'age', '>=18<65');

      expect(filters).toEqual([
        {
          age: {
            $gte: 18,
            $lt: 65,
          },
        },
      ]);
    });

    it('supports decimal and negative numbers', () => {
      const filters: Record<string, unknown>[] = [];

      addNumberFilter(filters, 'price', '>=-10.5<=20.5');

      expect(filters).toEqual([
        {
          price: {
            $gte: -10.5,
            $lte: 20.5,
          },
        },
      ]);
    });

    it('does not add a filter for invalid expressions', () => {
      const filters: Record<string, unknown>[] = [];

      addNumberFilter(filters, 'age', 'invalid');
      addNumberFilter(filters, 'age', '');
      addNumberFilter(filters, 'age', '>=10>=20');
      addNumberFilter(filters, 'age', '>=10<20<30');

      expect(filters).toEqual([]);
    });

    it('does not add a filter for undefined', () => {
      const filters: Record<string, unknown>[] = [];

      addNumberFilter(filters, 'age');

      expect(filters).toEqual([]);
    });
  });

  describe('parseComparisons', () => {
    it('parses equality expressions', () => {
      expect(parseComparisons('50')).toEqual({
        eq: 50,
      });
    });

    it('parses comparison expressions', () => {
      expect(parseComparisons('>10')).toEqual({
        gt: 10,
      });

      expect(parseComparisons('>=10')).toEqual({
        gte: 10,
      });

      expect(parseComparisons('<20')).toEqual({
        lt: 20,
      });

      expect(parseComparisons('<=20')).toEqual({
        lte: 20,
      });
    });

    it('parses combined comparison expressions', () => {
      expect(parseComparisons('>=10<20')).toEqual({
        gte: 10,
        lt: 20,
      });

      expect(parseComparisons('>10<=20')).toEqual({
        gt: 10,
        lte: 20,
      });
    });

    it('supports negative and decimal numbers', () => {
      expect(parseComparisons('>=-10.5<20.5')).toEqual({
        gte: -10.5,
        lt: 20.5,
      });
    });

    it('ignores whitespace', () => {
      expect(parseComparisons(' >= 10 < 20 ')).toEqual({
        gte: 10,
        lt: 20,
      });
    });

    it('returns an empty object for invalid expressions', () => {
      expect(parseComparisons('invalid')).toEqual({});
      expect(parseComparisons('')).toEqual({});
      expect(parseComparisons('>')).toEqual({});
      expect(parseComparisons('>=10abc')).toEqual({});
      expect(parseComparisons('>=10>=20')).toEqual({});
      expect(parseComparisons('<=20<30')).toEqual({});
      expect(parseComparisons('=10')).toEqual({});
    });

    it('does not allow duplicate lower or upper bounds', () => {
      expect(parseComparisons('>10>=20')).toEqual({});
      expect(parseComparisons('<10<=20')).toEqual({});
    });
  });

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

  describe('buildUpdateData', () => {
    it('builds updates for primitive fields', () => {
      expect(buildUpdateData({
        name: 'John',
        age: 25,
        is_active: true,
      })).toEqual({
        $set: {
          name: 'John',
          age: 25,
          is_active: true,
        },
      });
    });

    it('flattens nested objects into dot notation', () => {
      expect(buildUpdateData({
        name: 'John',
        profile: {
          city: 'Surabaya',
          address: {
            street: 'Jalan A',
            postal_code: '60123',
          },
        },
      })).toEqual({
        $set: {
          name: 'John',
          'profile.city': 'Surabaya',
          'profile.address.street': 'Jalan A',
          'profile.address.postal_code': '60123',
        },
      });
    });

    it('replaces arrays instead of flattening them', () => {
      expect(buildUpdateData({
        tags: ['developer', 'admin'],
        scores: [10, 20, 30],
      })).toEqual({
        $set: {
          tags: ['developer', 'admin'],
          scores: [10, 20, 30],
        },
      });
    });

    it('supports updating individual array indexes', () => {
      expect(buildUpdateData({
        'tags.500': 'admin',
        'tasks.500.completed': true,
      })).toEqual({
        $set: {
          'tags.500': 'admin',
          'tasks.500.completed': true,
        },
      });
    });

    it('supports null values as unset operations', () => {
      expect(buildUpdateData({
        department_id: null,
        profile: {
          avatar: null,
        },
      })).toEqual({
        $unset: {
          department_id: true,
          'profile.avatar': true,
        },
      });
    });

    it('ignores undefined values', () => {
      expect(buildUpdateData({
        name: undefined,
        email: undefined,
      })).toEqual({});
    });

    it('preserves Date objects', () => {
      const date = new Date('2026-01-01');

      expect(buildUpdateData({
        updated_at: date,
      })).toEqual({
        $set: {
          updated_at: date,
        },
      });
    });

    it('preserves other non-plain object values', () => {
      const value = new Map([
        ['key', 'value'],
      ]);

      expect(buildUpdateData({
        metadata: value,
      })).toEqual({
        $set: {
          metadata: value,
        },
      });
    });

    it('returns an empty object for empty input', () => {
      expect(buildUpdateData({})).toEqual({});
    });

    it('returns an empty object for nested empty objects', () => {
      expect(buildUpdateData({
        profile: {},
        settings: {
          notifications: {},
        },
      })).toEqual({});
    });

    it('returns both $set and $unset when necessary', () => {
      expect(buildUpdateData({
        name: 'John',
        email: null,
        profile: {
          city: 'Surabaya',
          avatar: null,
        },
      })).toEqual({
        $set: {
          name: 'John',
          'profile.city': 'Surabaya',
        },
        $unset: {
          email: true,
          'profile.avatar': true,
        },
      });
    });
  });

  const ID_1 = '665f1c2e8a1b2c3d4e5f6a7b';
  const ID_2 = '665f1c2e8a1b2c3d4e5f6a7c';

  /** Asserts a value is an ObjectId with the expected hex string. */
  const expectObjectId = (value: unknown, hex: string) => {
    expect(value).toBeInstanceOf(ObjectId);
    expect((value as ObjectId).toHexString()).toBe(hex);
  };

  describe('toObjectIds', () => {
    it('converts a plain field', () => {
      const result = toObjectIds({ name: 'Admin', created_by_id: ID_1 }, ['created_by_id']);

      expectObjectId(result['created_by_id'], ID_1);
      expect(result['name']).toBe('Admin');
    });

    it('converts a nested object field', () => {
      const result = toObjectIds(
        { owner: { user_id: ID_1, name: 'Ann' } },
        ['owner.user_id'],
      ) as { owner: { user_id: unknown; name: string } };

      expectObjectId(result.owner.user_id, ID_1);
      expect(result.owner.name).toBe('Ann');
    });

    it('converts every item of an array of IDs', () => {
      const result = toObjectIds({ permission_ids: [ID_1, ID_2] }, ['permission_ids']) as {
      permission_ids: unknown[];
    };

      expect(result.permission_ids).toHaveLength(2);
      expectObjectId(result.permission_ids[0], ID_1);
      expectObjectId(result.permission_ids[1], ID_2);
    });

    it('converts a field inside every item of an array of objects', () => {
      const result = toObjectIds(
        {
          approvers: [
            { user_id: ID_1, level: 1 },
            { user_id: ID_2, level: 2 },
          ],
        },
        ['approvers.user_id'],
      ) as { approvers: { user_id: unknown; level: number }[] };

      expectObjectId(result.approvers[0].user_id, ID_1);
      expectObjectId(result.approvers[1].user_id, ID_2);
      expect(result.approvers.map(a => a.level)).toEqual([1, 2]);
    });

    it('converts through an object that contains an array of objects', () => {
      const result = toObjectIds(
        { flow: { steps: [{ user_id: ID_1 }, { user_id: ID_2 }] } },
        ['flow.steps.user_id'],
      ) as { flow: { steps: { user_id: unknown }[] } };

      expectObjectId(result.flow.steps[0].user_id, ID_1);
      expectObjectId(result.flow.steps[1].user_id, ID_2);
    });

    it('converts several paths at once', () => {
      const result = toObjectIds(
        {
          created_by_id: ID_1,
          owner: { user_id: ID_1 },
          permission_ids: [ID_2],
          approvers: [{ user_id: ID_2 }],
        },
        ['created_by_id', 'owner.user_id', 'permission_ids', 'approvers.user_id'],
      ) as {
      created_by_id: unknown;
      owner: { user_id: unknown };
      permission_ids: unknown[];
      approvers: { user_id: unknown }[];
    };

      expectObjectId(result.created_by_id, ID_1);
      expectObjectId(result.owner.user_id, ID_1);
      expectObjectId(result.permission_ids[0], ID_2);
      expectObjectId(result.approvers[0].user_id, ID_2);
    });

    it('does not convert fields that are not listed', () => {
      const result = toObjectIds({ created_by_id: ID_1, code: ID_2 }, ['created_by_id']);

      expectObjectId(result['created_by_id'], ID_1);
      expect(result['code']).toBe(ID_2); // looks like an ID, but is not listed
    });

    it('does not mutate the input', () => {
      const input = {
        created_by_id: ID_1,
        owner: { user_id: ID_1 },
        approvers: [{ user_id: ID_2 }],
      };

      toObjectIds(input, ['created_by_id', 'owner.user_id', 'approvers.user_id']);

      expect(input.created_by_id).toBe(ID_1);
      expect(input.owner.user_id).toBe(ID_1);
      expect(input.approvers[0].user_id).toBe(ID_2);
    });

    it('skips missing fields without creating them', () => {
      const result = toObjectIds({ name: 'Admin' }, ['created_by_id', 'owner.user_id']);

      expect(result).toEqual({ name: 'Admin' });
      expect('created_by_id' in result).toBe(false);
      expect('owner' in result).toBe(false);
    });

    it('leaves null and undefined values as they are', () => {
      const result = toObjectIds({ created_by_id: null, role_id: undefined }, [
        'created_by_id',
        'role_id',
      ]);

      expect(result['created_by_id']).toBeNull();
      expect(result['role_id']).toBeUndefined();
    });

    it('keeps a value that is already an ObjectId', () => {
      const id = new ObjectId(ID_1);
      const result = toObjectIds({ created_by_id: id }, ['created_by_id']);

      expect(result['created_by_id']).toBe(id);
    });

    it('leaves invalid ID strings unchanged so schema validation can reject them', () => {
      const result = toObjectIds(
        { created_by_id: 'abc', role_id: ID_1 + 'ff' },
        ['created_by_id', 'role_id'],
      );

      expect(result['created_by_id']).toBe('abc');
      expect(result['role_id']).toBe(ID_1 + 'ff');
    });

    it('accepts uppercase hex strings', () => {
      const result = toObjectIds({ created_by_id: ID_1.toUpperCase() }, ['created_by_id']);

      expectObjectId(result['created_by_id'], ID_1);
    });

    it('skips a nested path when the parent is not a plain object', () => {
      const result = toObjectIds({ owner: 'not-an-object', tags: null }, [
        'owner.user_id',
        'tags.user_id',
      ]);

      expect(result).toEqual({ owner: 'not-an-object', tags: null });
    });

    it('skips array items that lack the key', () => {
      const result = toObjectIds(
        { approvers: [{ user_id: ID_1 }, { level: 2 }] },
        ['approvers.user_id'],
      ) as { approvers: { user_id?: unknown; level?: number }[] };

      expectObjectId(result.approvers[0].user_id, ID_1);
      expect(result.approvers[1]).toEqual({ level: 2 });
    });

    it('preserves Date and other untouched values by reference', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const result = toObjectIds({ created_at: createdAt, created_by_id: ID_1 }, ['created_by_id']);

      expect(result['created_at']).toBe(createdAt);
    });

    it('returns an equal document when no paths are given', () => {
      const input = { created_by_id: ID_1 };

      expect(toObjectIds(input, [])).toEqual(input);
    });
  });

  describe('fromObjectIds', () => {
    const oid1 = new ObjectId(ID_1);
    const oid2 = new ObjectId(ID_2);

    it('converts a plain field and _id', () => {
      const result = fromObjectIds({ _id: oid1, created_by_id: oid2, name: 'Admin' }, [
        '_id',
        'created_by_id',
      ]);

      expect(result).toEqual({ _id: ID_1, created_by_id: ID_2, name: 'Admin' });
    });

    it('converts a nested object field', () => {
      const result = fromObjectIds({ owner: { user_id: oid1, name: 'Ann' } }, ['owner.user_id']);

      expect(result).toEqual({ owner: { user_id: ID_1, name: 'Ann' } });
    });

    it('converts every item of an array of IDs', () => {
      const result = fromObjectIds({ permission_ids: [oid1, oid2] }, ['permission_ids']);

      expect(result).toEqual({ permission_ids: [ID_1, ID_2] });
    });

    it('converts a field inside every item of an array of objects', () => {
      const result = fromObjectIds(
        {
          approvers: [
            { user_id: oid1, level: 1 },
            { user_id: oid2, level: 2 },
          ],
        },
        ['approvers.user_id'],
      );

      expect(result).toEqual({
        approvers: [
          { user_id: ID_1, level: 1 },
          { user_id: ID_2, level: 2 },
        ],
      });
    });

    it('converts through an object that contains an array of objects', () => {
      const result = fromObjectIds(
        { flow: { steps: [{ user_id: oid1 }, { user_id: oid2 }] } },
        ['flow.steps.user_id'],
      );

      expect(result).toEqual({ flow: { steps: [{ user_id: ID_1 }, { user_id: ID_2 }] } });
    });

    it('converts several paths at once', () => {
      const result = fromObjectIds(
        {
          _id: oid1,
          owner: { user_id: oid1 },
          permission_ids: [oid2],
          approvers: [{ user_id: oid2 }],
        },
        ['_id', 'owner.user_id', 'permission_ids', 'approvers.user_id'],
      );

      expect(result).toEqual({
        _id: ID_1,
        owner: { user_id: ID_1 },
        permission_ids: [ID_2],
        approvers: [{ user_id: ID_2 }],
      });
    });

    it('does not convert ObjectIds that are not listed', () => {
      const result = fromObjectIds({ _id: oid1, other_id: oid2 }, ['_id']) as Record<string, unknown>;

      expect(result['_id']).toBe(ID_1);
      expect(result['other_id']).toBe(oid2);
    });

    it('does not mutate the input', () => {
      const input = {
        created_by_id: oid1,
        owner: { user_id: oid1 },
        approvers: [{ user_id: oid2 }],
      };

      fromObjectIds(input, ['created_by_id', 'owner.user_id', 'approvers.user_id']);

      expect(input.created_by_id).toBe(oid1);
      expect(input.owner.user_id).toBe(oid1);
      expect(input.approvers[0].user_id).toBe(oid2);
    });

    it('skips missing fields without creating them', () => {
      const result = fromObjectIds({ name: 'Admin' }, ['created_by_id', 'owner.user_id']);

      expect(result).toEqual({ name: 'Admin' });
      expect('created_by_id' in (result as object)).toBe(false);
      expect('owner' in (result as object)).toBe(false);
    });

    it('leaves null and undefined values as they are', () => {
      const result = fromObjectIds({ created_by_id: null, role_id: undefined }, [
        'created_by_id',
        'role_id',
      ]) as Record<string, unknown>;

      expect(result['created_by_id']).toBeNull();
      expect(result['role_id']).toBeUndefined();
    });

    it('leaves values that are already strings as they are', () => {
      const result = fromObjectIds({ created_by_id: ID_1, code: 'abc' }, ['created_by_id', 'code']);

      expect(result).toEqual({ created_by_id: ID_1, code: 'abc' });
    });

    it('skips a nested path when the parent is not a plain object', () => {
      const result = fromObjectIds({ owner: 'not-an-object', tags: null }, [
        'owner.user_id',
        'tags.user_id',
      ]);

      expect(result).toEqual({ owner: 'not-an-object', tags: null });
    });

    it('skips array items that lack the key', () => {
      const result = fromObjectIds(
        { approvers: [{ user_id: oid1 }, { level: 2 }] },
        ['approvers.user_id'],
      );

      expect(result).toEqual({ approvers: [{ user_id: ID_1 }, { level: 2 }] });
    });

    it('preserves Date and other untouched values by reference', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const result = fromObjectIds({ created_at: createdAt, _id: oid1 }, ['_id']) as Record<
      string,
      unknown
    >;

      expect(result['created_at']).toBe(createdAt);
    });

    it('returns an equal document when no paths are given', () => {
      const input = { _id: oid1 };

      expect(fromObjectIds(input, [])).toEqual(input);
    });

    it('returns the typed document', () => {
      const result = fromObjectIds<{ _id: string; name: string }>({ _id: oid1, name: 'Admin' }, [
        '_id',
      ]);

      expect(result._id).toBe(ID_1);
      expect(result.name).toBe('Admin');
    });

    it('converts ObjectId-like values created by another bson copy', () => {
      const foreign = { _bsontype: 'ObjectId', toHexString: () => ID_1 };

      const result = fromObjectIds({ _id: foreign }, ['_id']);

      expect(result).toEqual({ _id: ID_1 });
    });

    it('converts ObjectId-like values with the legacy "ObjectID" marker', () => {
      const legacy = { _bsontype: 'ObjectID', toHexString: () => ID_1 };

      const result = fromObjectIds({ _id: legacy }, ['_id']);

      expect(result).toEqual({ _id: ID_1 });
    });

    it('converts foreign ObjectId-like values inside arrays and nested paths', () => {
      const foreign1 = { _bsontype: 'ObjectId', toHexString: () => ID_1 };
      const foreign2 = { _bsontype: 'ObjectId', toHexString: () => ID_2 };

      const result = fromObjectIds(
        {
          permission_ids: [foreign1, foreign2],
          approvers: [{ user_id: foreign1 }, { user_id: foreign2 }],
        },
        ['permission_ids', 'approvers.user_id'],
      );

      expect(result).toEqual({
        permission_ids: [ID_1, ID_2],
        approvers: [{ user_id: ID_1 }, { user_id: ID_2 }],
      });
    });

    it('does not convert objects with a different _bsontype', () => {
      const decimal = { _bsontype: 'Decimal128', toHexString: () => 'nope' };

      const result = fromObjectIds({ amount: decimal }, ['amount']) as Record<string, unknown>;

      expect(result['amount']).toBe(decimal);
    });

    it('does not convert plain objects without a _bsontype', () => {
      const plain = { toHexString: () => 'nope' };

      const result = fromObjectIds({ value: plain }, ['value']) as Record<string, unknown>;

      expect(result['value']).toBe(plain);
    });
  });

  describe('toObjectIds and fromObjectIds round trip', () => {
    const paths = ['_id', 'created_by_id', 'owner.user_id', 'permission_ids', 'approvers.user_id'];

    it('restores the original document', () => {
      const original = {
        _id: ID_1,
        name: 'Admin',
        created_by_id: ID_2,
        owner: { user_id: ID_1, name: 'Ann' },
        permission_ids: [ID_1, ID_2],
        approvers: [
          { user_id: ID_1, level: 1 },
          { user_id: ID_2, level: 2 },
        ],
      };

      expect(fromObjectIds(toObjectIds(original, paths), paths)).toEqual(original);
    });

    it('restores a document that has missing and null fields', () => {
      const original = { _id: ID_1, created_by_id: null, name: 'Admin' };

      expect(fromObjectIds(toObjectIds(original, paths), paths)).toEqual(original);
    });
  });
});
