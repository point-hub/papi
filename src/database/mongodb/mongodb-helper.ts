import { isType } from '@point-hub/express-utils'
import { isValid } from 'date-fns'
import { CreateIndexesOptions, IndexSpecification, ObjectId } from 'mongodb'

import { IDatabase } from '../../index'

type ObjectIdToString<T> = T extends ObjectId
  ? string // If T is ObjectId, the result is string
  : T extends (infer U)[]
  ? ObjectIdToString<U>[] // If T is an array, map the elements
  : T extends Date // Exclude Date from deep mapping
  ? T
  : T extends object // If T is a plain object, recursively map its properties
  ? { [K in keyof T]: ObjectIdToString<T[K]> }
  : T; // Otherwise, return the type as is (primitives, null, etc.)

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function expandDottedKey(key: string, value: unknown): Record<string, unknown> {
  const parts = key.split('.')
  return parts.reduceRight<Record<string, unknown>>(
    (acc, part) => ({ [part]: acc }),
    value as Record<string, unknown>
  )
}

function deepMerge<T extends Record<string, unknown>, U extends Record<string, unknown>>(
  target: T,
  source: U
): T & U {
  const result: Record<string, unknown> = { ...target }

  for (const key of Object.keys(source)) {
    const sourceVal = source[key]
    const targetVal = result[key]

    if (isPlainObject(sourceVal) && isPlainObject(targetVal)) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>
      )
    } else {
      result[key] = sourceVal
    }
  }

  return result as T & U
}

function stringToDateIfISODateTime(str: string): string | Date {
  if (!str.includes('T')) return str

  const timestamp = Date.parse(str)
  if (Number.isNaN(timestamp)) return str

  return new Date(timestamp)
}

function convertPrimitive(value: unknown): unknown {
  if (!isString(value)) return value

  // Convert to ObjectId
  if (ObjectId.isValid(value)) {
    const oid = new ObjectId(value)
    if (oid.toString() === value) return oid
  }

  // Convert to Date
  return stringToDateIfISODateTime(value)
}

/**
 * https://www.mongodb.com/docs/drivers/node/current/fundamentals/indexes/
 * https://www.mongodb.com/docs/manual/reference/collation/
 * https://www.mongodb.com/docs/manual/core/index-sparse/
 * https://www.mongodb.com/docs/manual/core/index-partial/
 */
export class MongoDBHelper {
  private db

  constructor(db: IDatabase) {
    this.db = db
  }

  /**
   * Create unique column
   *
   * @example
   * create unique attribute "name"
   * createUnique(collection, {
   *   name: -1,
   * })
   *
   * @example
   * create unique attribute for multiple column "first_name" and "last_name"
   * createUnique(collection, {
   *   firstName: -1,
   *   lastName: -1,
   * })
   */
  public async createUnique(collection: string, properties: object) {
    await this.db.createIndex(collection, properties, {
      unique: true,
      collation: {
        locale: 'en',
        strength: 2
      }
    })
  }

  /**
   * Create unique if column is exists
   */
  public async createUniqueIfNotNull(collection: string, properties: object) {
    await this.db.createIndex(collection, properties, {
      unique: true,
      sparse: true,
      collation: {
        locale: 'en',
        strength: 2
      }
    })
  }

  public async createIndex(
    collection: string,
    spec: IndexSpecification,
    options?: CreateIndexesOptions
  ): Promise<void> {
    await this.db.createIndex(collection, spec, options)
  }

  public async isExists(name: string) {
    const collections = (await this.db.listCollections()) as []
    return collections.some(function (collection: { name: string }) {
      return collection.name === name
    })
  }

  public static stringToObjectId(ids: string[]): ObjectId[];
  public static stringToObjectId<T>(input: T): T;
  public static stringToObjectId(input: unknown): unknown {
    // If it's NOT an object, just convert primitive
    if (!isPlainObject(input)) {
      return MongoDBHelper.convertToObjectId(input)
    }

    // Expand dotted KEYS
    const expanded = MongoDBHelper.expandDottedObject(input)

    // Then convert every value deeply
    return MongoDBHelper.convertToObjectId(expanded)
  }

  public static expandDottedObject(obj: Record<string, unknown>): Record<string, unknown> {
    let result: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('filter.') && key.includes('.')) {
        const rest = key.substring('filter.'.length)

        const fragment = {
          filter: {
            [rest]: value
          }
        }

        result = deepMerge(result, fragment)
        continue
      }

      if (key.includes('.')) {
        const fragment = expandDottedKey(key, value)
        result = deepMerge(result, fragment)
        continue
      }

      result[key] = value
    }

    return result
  }

  public static convertToObjectId(input: unknown): unknown {
    if (input === null || input === undefined) return input

    if (input instanceof ObjectId) return input

    if (input instanceof Date) return input

    if (typeof input !== 'object') {
      return convertPrimitive(input) // your existing check
    }

    if (Array.isArray(input)) {
      return input.map(item => MongoDBHelper.convertToObjectId(item))
    }

    if (isPlainObject(input)) {
      const out: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(input)) {
        out[key] = MongoDBHelper.convertToObjectId(value)
      }
      return out
    }

    return input
  }

  /**
   * Recursively converts all ObjectId instances within a structure to strings.
   * @param value The input data structure.
   * @returns The data structure with ObjectId instances converted to strings.
   */
  public static objectIdToString<T>(value: T): ObjectIdToString<T> {
    // null / undefined
    if (value == null) {
      return value as ObjectIdToString<T> // Cast as T is T or null/undefined
    }

    // ObjectId → string
    if (value instanceof ObjectId) {
      return value.toString() as ObjectIdToString<T>
    }

    // Array
    if (Array.isArray(value)) {
      // The map ensures the type is handled correctly by the utility type
      const arr = value.map(item =>
        MongoDBHelper.objectIdToString(item)
      )
      // The return type is guaranteed to be ObjectIdToString<T> due to the map
      return arr as ObjectIdToString<T>
    }

    // Date → leave unchanged
    if (value instanceof Date) {
      return value as ObjectIdToString<T>
    }

    // Plain object
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>
      const result: Record<string, unknown> = {}

      for (const key of Object.keys(obj)) {
        // Recursive call
        result[key] = MongoDBHelper.objectIdToString(obj[key])
      }

      // Cast the resulting object to the complex mapped type
      return result as ObjectIdToString<T>
    }

    // Primitive → unchanged
    return value as ObjectIdToString<T>
  }

  /**
   * Deeply cleans an object by removing properties that are:
   * 1. Undefined
   * 2. Null
   * 3. Empty objects ({})
   * 4. Empty arrays ([])
   * * @param rawInput The input data object.
   * @returns The deeply filtered object, or an empty object if all content was filtered.
   */
  public static buildPostData(rawInput: Record<string, any>): Record<string, any> {

    /**
     * Recursively cleans the object.
     */
    const recursiveFilter = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return undefined // Filter out null and undefined directly
      }

      if (Array.isArray(obj)) {
        // Filter out empty array elements, then filter out the array if it becomes empty
        const cleanedArray = obj.map(recursiveFilter).filter(value => value !== undefined)
        return cleanedArray.length > 0 ? cleanedArray : undefined

      } else if (typeof obj === 'object' && !isValid(obj) && !(obj instanceof ObjectId)) {
        // Handle non-null, non-array, non-date, non-ObjectId objects
        const cleanedObject: Record<string, any> = {}
        let hasContent = false

        for (const key in obj) {
          if (!Object.prototype.hasOwnProperty.call(obj, key)) {
            continue
          }

          const value = recursiveFilter(obj[key]) // Recurse

          if (value !== undefined) {
            cleanedObject[key] = value
            hasContent = true
          }
        }

        // Filter out the object if it becomes empty
        return hasContent ? cleanedObject : undefined

      } else {
        // Primitive value, Date, or ObjectId: return as is
        return obj
      }
    }

    // Start cleaning and ensure the result is always an object, even if empty.
    const result = recursiveFilter(rawInput)
    return (typeof result === 'object' && result !== null) ? result : {}
  }

  /**
   * Builds a clean array of documents for a MongoDB insertMany operation.
   * It iterates over the array, applying deep filtering to each document.
   * Documents that become empty after filtering are removed from the array.
   */
  public static buildPostManyData(rawInput: Array<Record<string, any>>): Array<Record<string, any>> {
    if (!Array.isArray(rawInput)) {
      // Handle non-array input robustly, though type checking should prevent this. Returning empty array.
      return []
    }

    // 1. Iterate over the raw input array.
    const cleanedDocuments = rawInput.map(doc => {
      // 2. Apply the single-document cleaning logic (buildPostData) to each document.
      return MongoDBHelper.buildPostData(doc)
    }).filter(cleanedDoc => {
      // 3. Filter out any documents that became completely empty ({}) after cleaning.
      // The deepFilter returns {} for an empty input, so we check if it's non-empty.
      return Object.keys(cleanedDoc).length > 0
    })

    return cleanedDocuments
  }

  /**
   * Builds safe MongoDB $set and $unset operations for a PATCH request.
   * It flattens nested objects into dot notation and handles explicit null values for $unset.
   * Undefined values are ignored.
   */
  public static buildPatchData = (rawInput: Record<string, any>): { $set?: Record<string, any>, $unset?: Record<string, true>, $push?: Record<string, any>, $pull?: Record<string, any>, } => {
    const setOperations: Record<string, any> = {}
    const unsetOperations: Record<string, true> = {}
    const pushOperations: Record<string, any> = {}
    const pullOperations: Record<string, any> = {}
    /**
     * Recursively traverses the object and populates $set/$unset operations.
     */
    const flattenAndSeparate = (obj: Record<string, any>, prefix: string = '') => {
      for (const key in obj) {
        const currentKey = prefix + key
        const value = obj[key]

        if (value === undefined) continue

        if (value === null) {
          unsetOperations[currentKey] = true
          continue
        }

        if (isType(value, 'object') && value.$push !== undefined) {
          pushOperations[currentKey] = value.$push
          continue
        }

        if (isType(value, 'object') && value.$pull !== undefined) {
          pullOperations[currentKey] = value.$pull
          continue
        }

        if (
          isType(value, 'object') &&
          !Array.isArray(value) &&
          !isType(value, 'date') &&
          !(value instanceof ObjectId)
        ) {
          flattenAndSeparate(value, currentKey + '.')
        } else {
          setOperations[currentKey] = value
        }
      }

    }

    // Start processing from the top level
    flattenAndSeparate(rawInput)

    // Assemble and return the final update document
    const updateDoc: any = {}

    if (Object.keys(setOperations).length > 0) {
      updateDoc.$set = setOperations
    }

    if (Object.keys(unsetOperations).length > 0) {
      updateDoc.$unset = unsetOperations
    }

    if (Object.keys(pushOperations).length > 0) {
      updateDoc.$push = pushOperations
    }

    if (Object.keys(pullOperations).length > 0) {
      updateDoc.$pull = pullOperations
    }

    return updateDoc
  }
}
