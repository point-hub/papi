type Primitive = string | number | boolean | null | undefined

type Data = Primitive | DataObject | DataArray
interface DataObject {
  [key: string]: Data
}
type DataArray = Array<Data>

interface MongoUpdate {
  $set?: Record<string, unknown>
  $unset?: Record<string, string>
}

/**
 * Compose MongoDB update operators ($set and $unset) based on input data.
 * Fields with empty string or null values will be added to $unset,
 * all other fields will be added to $set.
 * Supports nested objects and arrays.
 *
 * @param data - Input object to transform
 * @param parentKey - Internal key path prefix for recursion
 * @returns MongoDB update object with $set and/or $unset
 */
export function composeUpdate(data: DataObject, parentKey = ''): MongoUpdate {
  const updates: MongoUpdate = { $set: {}, $unset: {} }

  function isObject(value: unknown): value is DataObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
  }

  function process(value: Data, keyPath: string): void {
    if (value === '' || value === null || value === undefined) {
      updates.$unset![keyPath] = ''
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        process(item, `${keyPath}.${index}`)
      })
    } else if (isObject(value)) {
      Object.entries(value).forEach(([k, v]) => {
        process(v, `${keyPath}.${k}`)
      })
    } else if (value !== undefined) {
      updates.$set![keyPath] = value
    }
  }

  Object.entries(data).forEach(([key, value]) => {
    const fullKey = parentKey ? `${parentKey}.${key}` : key
    process(value, fullKey)
  })

  if (updates.$set && Object.keys(updates.$set).length === 0) delete updates.$set
  if (updates.$unset && Object.keys(updates.$unset).length === 0) delete updates.$unset

  return updates
}
