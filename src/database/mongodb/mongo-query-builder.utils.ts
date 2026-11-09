
import type { SortDirection } from 'mongodb';

export interface IFieldsObject {
  [key: string]: number
}

export interface ISortObject {
  [key: string]: SortDirection
}

export interface IMongoUpdate {
  $set?: Record<string, unknown>
  $unset?: Record<string, true>
}

/**
 * Parses a page query parameter into a positive integer.
 *
 * @param value - Page number as a string or number. Defaults to `1`.
 * @returns Parsed page number or `1` if the value is invalid.
 *
 * @example
 * parsePage('10') // => 10
 * parsePage(10) // => 10
 * parsePage('abc') // => 1
 * parsePage(0) // => 1
 */
export function parsePage(value: string | number = 1): number {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : value;

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

/**
 * Parses a page size query parameter into a positive integer.
 *
 * @param value - Number of records per page. Defaults to `10`.
 * @returns Parsed page size or `10` if the value is invalid.
 *
 * @example
 * parsePageSize('10') // => 10
 * parsePageSize(10) // => 10
 * parsePageSize('abc') // => 10
 * parsePageSize(0) // => 10
 */
export function parsePageSize(value: string | number = 10): number {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : value;

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 10;
}

/**
 * Calculates the number of records to skip for pagination.
 *
 * @param currentPage - Current page number.
 * @param pageSize - Number of records per page.
 * @returns Number of records to skip.
 *
 * @example
 * calculateSkip(1, 10) // => 0
 * calculateSkip(2, 10) // => 10
 * calculateSkip(3, 10) // => 20
 */
export function calculateSkip(currentPage: string | number, pageSize: string | number): number {
  return (parsePage(currentPage) - 1) * parsePageSize(pageSize);
}

/**
 * Converts a comma-separated or space-separated field string
 * into a MongoDB projection object.
 *
 * Supports either inclusion or exclusion projections.
 * Excluded fields cannot be combined with included fields,
 * except for MongoDB's special `_id` field.
 *
 * @param value - Comma-separated or space-separated field names to include.
 * @param excludedFields - Field names to exclude.
 * @returns MongoDB projection object.
 *
 * @example
 * parseProjection('name, address')
 * // => { name: 1, address: 1 }
 *
 * parseProjection('', ['password', 'token'])
 * // => { password: 0, token: 0 }
 *
 * parseProjection('name, address', ['_id'])
 * // => { name: 1, address: 1, _id: 0 }
 */
export function parseProjection(value = '', excludedFields: string[] = []): IFieldsObject {
  const includedFields = parseFieldList(value);
  const normalizedExcludedFields = excludedFields.map((field) => field.trim()).filter(Boolean);

  if (includedFields.length > 0 && normalizedExcludedFields.some((field) => field !== '_id')) {
    throw new Error('Cannot mix inclusion and exclusion fields in MongoDB projection');
  }

  const projection = createProjection(includedFields);

  return excludeFields(projection, normalizedExcludedFields);
}

/**
 * Converts a comma-separated or space-separated string into an array of field names.
 *
 * @param value - String containing field names.
 * @returns Array of trimmed, non-empty field names.
 *
 * @example
 * parseFieldList('name, address')
 * // => ['name', 'address']
 *
 * parseFieldList('name address')
 * // => ['name', 'address']
 *
 * parseFieldList(' name, address ')
 * // => ['name', 'address']
 */
export function parseFieldList(value: string): string[] {
  return value
    .split(/[,\s]+/)
    .map((field) => field.trim())
    .filter(Boolean);
}

/**
 * Creates a MongoDB projection object from an array of field names.
 *
 * @param fields - Array of field names.
 * @param value - Projection value assigned to each field. Defaults to `1`.
 * @returns MongoDB projection object.
 *
 * @example
 * createProjection(['name', 'address'])
 * // => { name: 1, address: 1 }
 *
 * createProjection(['name', 'address'], 0)
 * // => { name: 0, address: 0 }
 */
export function createProjection(fields: string[], value = 1): IFieldsObject {
  const projection: IFieldsObject = {};

  for (const field of fields) {
    const name = field.trim();

    if (name) {
      projection[name] = value;
    }
  }

  return projection;
}

/**
 * Creates a MongoDB sort object from an array of field names.
 *
 * A field prefixed with `-` is sorted in descending order.
 * Fields without a prefix are sorted in ascending order.
 *
 * @param fields - Array of field names with optional negative prefixes.
 * @returns MongoDB sort object.
 *
 * @example
 * createSort(['-firstName', 'lastName', 'created_at'])
 * // => { firstName: -1, lastName: 1, created_at: 1 }
 */
export function createSort(fields: string[]): Record<string, 1 | -1> {
  return fields.reduce(
    (sortObject, field) => {
      const trimmedField = field.trim();
      const descending = trimmedField.startsWith('-');
      const fieldName = descending ? trimmedField.slice(1).trim() : trimmedField;

      if (fieldName) {
        sortObject[fieldName] = descending ? -1 : 1;
      }

      return sortObject;
    },
    {} as Record<string, 1 | -1>,
  );
}

/**
 * Excludes specified fields from a MongoDB projection object.
 *
 * Modifies the original projection object by assigning `0`
 * to each excluded field.
 *
 * @param projection - MongoDB projection object to modify.
 * @param fields - Array of field names to exclude.
 * @returns The modified projection object.
 *
 * @example
 * excludeFields({ name: 1, address: 1 }, ['_id'])
 * // => { name: 1, address: 1, _id: 0 }
 */
export function excludeFields(projection: IFieldsObject, fields: string[]): IFieldsObject {
  for (const field of fields) {
    const name = field.trim();

    if (name) {
      projection[name] = 0;
    }
  }

  return projection;
}

/**
 * Parses a comma-separated field string into a MongoDB sort object.
 *
 * A field prefixed with `-` is sorted in descending order.
 * Fields without a prefix are sorted in ascending order.
 *
 * @param value - Comma-separated field names with optional negative prefixes.
 * @returns MongoDB sort object.
 *
 * @example
 * parseSort('name, -createdAt')
 * // => { name: 1, createdAt: -1 }
 *
 * parseSort('-createdAt, name')
 * // => { createdAt: -1, name: 1 }
 */
export function parseSort(value: string): ISortObject {
  const fields = parseFieldList(value);

  return fields.reduce<ISortObject>((sortObject, field) => {
    const descending = field.startsWith('-');
    const fieldName = descending ? field.slice(1).trim() : field;

    if (fieldName) {
      sortObject[fieldName] = descending ? -1 : 1;
    }

    return sortObject;
  }, {});
}

/**
 * Adds a case-insensitive regex filter to the filters array if a value is provided.
 *
 * @param filters - An array of MongoDB filter objects to be modified.
 * @param field - The field name to apply the regex on.
 * @param value - The string value to search for (optional). If empty or only whitespace, no filter is added.
 *
 * @example
 * const filters: Record<string, unknown>[] = []
 *
 * addRegexFilter(filters, 'name', 'john')
 *
 * // Result:
 * // [{ name: { $regex: 'john', $options: 'i' } }]
 */
export const addRegexFilter = (filters: Record<string, unknown>[], field: string, value?: string) => {
  if (value?.trim()) {
    filters.push({ [field]: { $regex: value.trim(), $options: 'i' } });
  }
};

/**
 * Adds an exact-match filter to the filters array if a value is provided.
 *
 * @param filters - An array of MongoDB filter objects to be modified.
 * @param field - The field name to match exactly.
 * @param value - The exact value to match (optional). If empty or only whitespace, no filter is added.
 *
 * @example
 * const filters: Record<string, unknown>[] = []
 *
 * addExactFilter(filters, 'status', 'active')
 *
 * // Result:
 * // [{ status: 'active' }]
 */
export const addExactFilter = (filters: Record<string, unknown>[], field: string, value?: string) => {
  if (value?.trim()) {
    filters.push({ [field]: value.trim() });
  }
};

/**
 * Parses a boolean value from a string or boolean input.
 *
 * - Accepts `true` / `false` booleans directly.
 * - Converts string values `"true"` and `"false"` to booleans.
 * - Returns `undefined` for any other value.
 *
 * @param value - A boolean or a string representation of a boolean.
 * @returns `true`, `false`, or `undefined` if the value cannot be parsed.
 *
 * @example
 * parseBoolean(true)       // true
 * parseBoolean('true')     // true
 * parseBoolean('false')    // false
 * parseBoolean('invalid')  // undefined
 * parseBoolean()           // undefined
 */
export const parseBoolean = (value?: string | boolean): boolean | undefined => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }

  return undefined;
};

/**
 * Adds a boolean exact-match filter to the filters array.
 *
 * The filter is only added if the value can be successfully parsed
 * into a boolean (`true` or `false`).
 *
 * @param filters - An array of MongoDB filter objects to be modified.
 * @param field - The field name to match.
 * @param value - A boolean or string (`"true"` / `"false"`) to match.
 *
 * @example
 * const filters: Record<string, unknown>[] = []
 *
 * addBooleanFilter(filters, 'is_active', 'true')
 * addBooleanFilter(filters, 'is_verified', false)
 *
 * // Result:
 * // [
 * //   { is_active: true },
 * //   { is_verified: false }
 * // ]
 */
export const addBooleanFilter = (
  filters: Record<string, unknown>[],
  field: string,
  value?: string | boolean,
) => {
  const parsed = parseBoolean(value);

  if (parsed !== undefined) {
    filters.push({ [field]: parsed });
  }
};

/**
 * Adds a MongoDB date range filter (`$gte` / `$lte`) to the filters array.
 *
 * The filter is only added if at least one of `value_from` or `value_to`
 * is provided and non-empty.
 *
 * @param filters - An array of MongoDB filter objects to be modified.
 * @param field - The date field name to apply the range filter on.
 * @param value_from - The start date (inclusive) as a string.
 * @param value_to - The end date (inclusive) as a string.
 *
 * @example
 * const filters: Record<string, unknown>[] = []
 *
 * addDateRangeFilter(filters, 'created_at', '2026-01-01', '2026-12-31')
 *
 * // Result:
 * // [
 * //   {
 * //     created_at: {
 * //       $gte: new Date('2026-01-01'),
 * //       $lte: new Date('2026-12-31')
 * //     }
 * //   }
 * // ]
 *
 * @example
 * const filters: Record<string, unknown>[] = []
 *
 * addDateRangeFilter(filters, 'created_at', '2026-01-01')
 *
 * // Result:
 * // [{ created_at: { $gte: new Date('2026-01-01') } }]
 */
export const addDateRangeFilter = (filters: Record<string, unknown>[], field: string, value_from?: string, value_to?: string) => {
  if (value_from?.trim() || value_to?.trim()) {
    const range: Record<string, unknown> = {};
    if (value_from?.trim()) {
      range['$gte'] = new Date(value_from?.trim());
    }
    if (value_to?.trim()) {
      range['$lte'] = new Date(value_to?.trim());
    }
    filters.push({ [field]: range });
  }
};

/**
 * Adds a numeric filter to the filters array based on comparison operators or a single value.
 *
 * Accepts expressions like `">10<20"`, `"<=15"`, `"=5"` or `"50"` (interpreted as equality).
 *
 * @param filters - An array of MongoDB filter objects to be modified.
 * @param field - The field name to apply the numeric comparison on.
 * @param value - A string representing the numeric comparison(s).
 *
 * @example
 * const filters: Record<string, unknown>[] = []
 *
 * addNumberFilter(filters, 'age', '>=18<65')
 * addNumberFilter(filters, 'score', '90')
 *
 * // Result:
 * // [
 * //   { age: { $gte: 18, $lt: 65 } },
 * //   { score: 90 }
 * // ]
 */
export const addNumberFilter = (filters: Record<string, unknown>[], field: string, value?: string) => {
  if (typeof value !== 'string' || value.trim() === '') return;

  const constraints = parseComparisons(value);
  const mongoFilter: Record<string, number> = {};

  if (constraints.eq !== undefined) {
    filters.push({ [field]: constraints.eq });
    return;
  }

  if (constraints.gt !== undefined) mongoFilter['$gt'] = constraints.gt;
  if (constraints.gte !== undefined) mongoFilter['$gte'] = constraints.gte;
  if (constraints.lt !== undefined) mongoFilter['$lt'] = constraints.lt;
  if (constraints.lte !== undefined) mongoFilter['$lte'] = constraints.lte;

  if (Object.keys(mongoFilter).length > 0) {
    filters.push({ [field]: mongoFilter });
  }
};

/**
 * Parses a string expression into MongoDB-style numeric comparison operators.
 *
 * Supported formats:
 * - `"50"` → `{ eq: 50 }`
 * - `">10"` → `{ gt: 10 }`
 * - `"<=15"` → `{ lte: 15 }`
 * - `">=5<20"` → `{ gte: 5, lt: 20 }`
 *
 * Constraints:
 * - Only one lower-bound (`>` or `>=`) and one upper-bound (`<` or `<=`) operator are allowed.
 * - Returns an empty object for malformed or ambiguous expressions.
 *
 * @param expr - A string representing numeric comparisons.
 * @returns An object with numeric comparison constraints.
 *
 * @example
 * parseComparisons('50')
 * // { eq: 50 }
 *
 * parseComparisons('>10')
 * // { gt: 10 }
 *
 * parseComparisons('>=5<20')
 * // { gte: 5, lt: 20 }
 *
 * parseComparisons('<=15')
 * // { lte: 15 }
 *
 * parseComparisons('invalid')
 * // {}
 *
 * @throws Will throw an API error if the input format is invalid or has duplicate bounds.
 */
export const parseComparisons = (
  expr: string,
): {
  gt?: number
  gte?: number
  lt?: number
  lte?: number
  eq?: number
} => {
  if (typeof expr !== 'string') return {};

  const cleanedExpr = expr.replace(/\s+/g, '');

  // pure number (int or decimal)
  if (/^-?\d+(?:\.\d+)?$/.test(cleanedExpr)) {
    const value = Number(cleanedExpr);
    return Number.isNaN(value) ? {} : { eq: value };
  }

  const regex = /(<=|>=|<|>)(-?\d+(?:\.\d+)?)/g;
  const result: Record<string, number> = {};
  let matchedStr = '';
  let hasLowerBound = false;
  let hasUpperBound = false;

  let match;
  while ((match = regex.exec(cleanedExpr)) !== null) {
    const [full, operator, valueStr] = match;
    const value = Number(valueStr);
    if (Number.isNaN(value)) return {};

    matchedStr += full;

    switch (operator) {
    case '>':
    case '>=':
      if (hasLowerBound) return {};
      result[operator === '>' ? 'gt' : 'gte'] = value;
      hasLowerBound = true;
      break;

    case '<':
    case '<=':
      if (hasUpperBound) return {};
      result[operator === '<' ? 'lt' : 'lte'] = value;
      hasUpperBound = true;
      break;
    }
  }

  // malformed input → silent fail
  if (matchedStr !== cleanedExpr) return {};

  return result;
};

/**
 * Checks whether a value is a plain object.
 *
 * Plain objects have either Object.prototype or null as their prototype.
 * Arrays, Dates, ObjectIds, and other class instances are excluded.
 *
 * @param value - Value to check.
 * @returns True if the value is a plain object.
 */
export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
};

/**
 * Builds a MongoDB update document from input data.
 *
 * Nested plain objects are recursively flattened into dot-notation paths.
 * Arrays and other non-plain objects are treated as complete values and
 * assigned using `$set`.
 *
 * Explicit dot-notation keys can be used to update individual nested fields
 * or array indexes without replacing the entire array.
 *
 * Value handling:
 * - `undefined`: Ignored; the existing field remains unchanged.
 * - `null`: Added to `$unset` to remove the existing field.
 * - Plain object: Recursively flattened into dot-notation paths.
 * - Array: Added to `$set` as a complete array.
 * - Other values: Added to `$set`.
 *
 * @param rawInput - Input data to convert into MongoDB update operations.
 * @returns MongoDB update document containing `$set` and/or `$unset`.
 * Returns an empty object when there are no applicable updates.
 *
 * @example
 * // Update primitive and nested fields.
 * buildUpdateData({
 *   name: 'John',
 *   profile: {
 *     city: 'Surabaya',
 *     postal_code: '60123',
 *   },
 * });
 *
 * // Returns:
 * {
 *   $set: {
 *     name: 'John',
 *     'profile.city': 'Surabaya',
 *     'profile.postal_code': '60123',
 *   },
 * }
 *
 * @example
 * // Replace an entire array.
 * buildUpdateData({
 *   tags: ['developer', 'admin'],
 * });
 *
 * // Returns:
 * {
 *   $set: {
 *     tags: ['developer', 'admin'],
 *   },
 * }
 *
 * @example
 * // Update a specific array index without replacing the entire array.
 * buildUpdateData({
 *   'tags.500': 'admin',
 * });
 *
 * // Returns:
 * {
 *   $set: {
 *     'tags.500': 'admin',
 *   },
 * }
 *
 * @example
 * // Update a nested property inside an array.
 * buildUpdateData({
 *   'tasks.500.completed': true,
 * });
 *
 * // Returns:
 * {
 *   $set: {
 *     'tasks.500.completed': true,
 *   },
 * }
 *
 * @example
 * // Remove fields using null values.
 * buildUpdateData({
 *   department_id: null,
 *   profile: {
 *     avatar: null,
 *   },
 * });
 *
 * // Returns:
 * {
 *   $unset: {
 *     department_id: true,
 *     'profile.avatar': true,
 *   },
 * }
 *
 * @example
 * // Ignore undefined values.
 * buildUpdateData({
 *   name: undefined,
 *   email: undefined,
 * });
 *
 * // Returns:
 * {}
 *
 * @example
 * // Preserve Date and other non-plain object values.
 * buildUpdateData({
 *   updated_at: new Date(),
 * });
 *
 * // Returns:
 * {
 *   $set: {
 *     updated_at: Date,
 *   },
 * }
 */
export const buildUpdateData = (
  rawInput: Record<string, unknown>,
): IMongoUpdate => {
  const $set: Record<string, unknown> = {};
  const $unset: Record<string, true> = {};

  const walk = (obj: Record<string, unknown>, prefix = ''): void => {
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;

      if (value === undefined) {
        continue;
      }

      if (value === null) {
        $unset[path] = true;
      } else if (isPlainObject(value)) {
        walk(value, path);
      } else {
        $set[path] = value;
      }
    }
  };

  walk(rawInput);

  const update: IMongoUpdate = {};

  if (Object.keys($set).length > 0) {
    update.$set = $set;
  }

  if (Object.keys($unset).length > 0) {
    update.$unset = $unset;
  }

  return update;
};

/**
 * Collection of utility functions.
 */
export default {
  parsePage,
  parsePageSize,
  calculateSkip,
  parseProjection,
  parseSort,
  parseFieldList,
  createProjection,
  createSort,
  excludeFields,
  addRegexFilter,
  addExactFilter,
  parseBoolean,
  addBooleanFilter,
  addDateRangeFilter,
  addNumberFilter,
  parseComparisons,
  isPlainObject,
  buildUpdateData,
};
