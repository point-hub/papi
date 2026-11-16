/**
 * Determines whether a value is a plain object.
 *
 * A plain object is an object created using Object.prototype
 * or a null prototype.
 *
 * @param value - Value to check.
 * @returns True if the value is a plain object; otherwise false.
 */
export default function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}
