import { SortDirection } from 'mongodb'

interface IFieldsObject {
  [key: string]: number
}

interface ISortObject {
  [key: string]: SortDirection
}

/**
 * Parse query string to number
 *
 * @example
 * page("10") // => 10
 * page(10) // => 10
 */
export function page(page: string | number = 1): number {
  if (typeof page === 'string') {
    return parseInt(page)
  }

  return page
}

/**
 * Parse query string to number
 *
 * @example
 * limit("10") // => 10
 * limit(10) // => 10
 */
export function limit(pageSize: string | number = 10): number {
  if (typeof pageSize === 'string') {
    return parseInt(pageSize)
  }

  return pageSize
}

/**
 * Skip number of data from page
 *
 * @example
 * skip(1, 10) // => 0
 * skip(2, 10) // => 10
 * skip(3, 10) // => 20
 */
export function skip(currentPage: string | number, pageSize: string | number): number {
  return (page(currentPage) - 1) * limit(pageSize)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function filter(filter: any) {
  return filter
}

/**
 * Convert string param to mongodb field object
 *
 * @example
 * fields("name, address") // => { name: 1, address: 1 }
 */
export function fields(fields = '', excludeFields: string[] = []): IFieldsObject {
  const obj: IFieldsObject = convertArrayToObject(convertStringToArray(fields))

  return filterExludeFields(obj, excludeFields)
}

/**
 * Convert string to array
 *
 * @example
 * convertStringToArray("name, address") // => ["name", "address"]
 */
export function convertStringToArray(fields: string): string[] {
  return fields
    .split(' ')
    .join()
    .split(',')
    .filter((el) => el)
}

/**
 * Convert array to mongodb field object
 *
 * @example
 * convertArrayToObject(["name", "address"]) // => { name: 1, address: 1 }
 * convertArrayToObject(["name", "address"], -1) // => { name: -1, address: -1 }
 */
export function convertArrayToObject(array: string[], value = 1): IFieldsObject {
  const obj: IFieldsObject = {}
  for (let i = 0; i < array.length; i++) {
    obj[`${array[i].trim()}`] = value
  }
  return obj
}

/**
 * Remove excluded fields
 *
 * @example
 * ex: { password: 0 }
 */
export function filterExludeFields(obj: IFieldsObject, excludeFields: string[]): IFieldsObject {
  for (let i = 0; i < excludeFields.length; i++) {
    obj[`${excludeFields[i]}`] = 0
  }
  return obj
}

/**
 * Convert string param to mongodb sort object
 *
 * @example
 * sort("name, -createdAt") // => { name: 1, createdAt: -1 }
 */
export function sort(fields: string): ISortObject {
  const obj: ISortObject = {}

  if (fields) {
    fields.split(',').forEach(function (field) {
      if (field.charAt(0) === '-') {
        field = field.substring(1)
        obj[field.trim()] = -1
      } else {
        obj[field.trim()] = 1
      }
    })
  }
  return obj
}

export default {
  page,
  limit,
  skip,
  sort,
  fields,
  filter,
  filterExludeFields,
  convertStringToArray,
  convertArrayToObject,
}
