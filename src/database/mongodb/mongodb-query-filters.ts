import { BaseErrorHandler } from '../..'

/**
 * Adds a case-insensitive regex filter to the filters array if a value is provided.
 *
 * @param filters - An array of MongoDB filter objects to be modified.
 * @param field - The field name to apply the regex on.
 * @param value - The string value to search for (optional). If empty or only whitespace, no filter is added.
 */
export const addRegexFilter = (filters: Record<string, unknown>[], field: string, value?: string) => {
  if (value?.trim()) {
    filters.push({ [field]: { $regex: value.trim(), $options: 'i' } })
  }
}

/**
 * Adds a numeric filter to the filters array based on comparison operators or a single value.
 *
 * Accepts expressions like `">10<20"`, `"<=15"`, `"=5"` or `"50"` (interpreted as equality).
 *
 * @param filters - An array of MongoDB filter objects to be modified.
 * @param field - The field name to apply the numeric comparison on.
 * @param value - A string representing the numeric comparison(s).
 */
export const addNumberFilter = (filters: Record<string, unknown>[], field: string, value?: string) => {
  if (typeof value !== 'string' || value.trim() === '') return

  const constraints = parseComparisons(value)
  const mongoFilter: Record<string, number> = {}

  if (constraints.eq !== undefined) {
    filters.push({ [field]: constraints.eq })
    return
  }

  if (constraints.gt !== undefined) mongoFilter['$gt'] = constraints.gt
  if (constraints.gte !== undefined) mongoFilter['$gte'] = constraints.gte
  if (constraints.lt !== undefined) mongoFilter['$lt'] = constraints.lt
  if (constraints.lte !== undefined) mongoFilter['$lte'] = constraints.lte

  if (Object.keys(mongoFilter).length > 0) {
    filters.push({ [field]: mongoFilter })
  }
}

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
 * - Throws an API error for malformed or ambiguous expressions.
 *
 * @param expr - A string representing numeric comparisons.
 * @returns An object with numeric comparison constraints.
 *
 * @throws Will throw an API error if the input format is invalid or has duplicate bounds.
 */
export const parseComparisons = (
  expr: string
): {
  gt?: number
  gte?: number
  lt?: number
  lte?: number
  eq?: number
} => {
  const cleanedExpr = expr.replace(/\s+/g, '')

  if (/^\d+$/.test(cleanedExpr)) {
    return { eq: parseInt(cleanedExpr, 10) }
  }

  const regex = /(<=|>=|<|>)(\d+)/g
  const result: Record<string, number> = {}
  let matchedStr = ''
  let hasLowerBound = false
  let hasUpperBound = false

  let match
  while ((match = regex.exec(cleanedExpr)) !== null) {
    const [full, operator, valueStr] = match
    const value = parseInt(valueStr, 10)
    matchedStr += full

    switch (operator) {
    case '>':
    case '>=':
      if (hasLowerBound)
        throw new BaseErrorHandler.ApiError('Bad Request', { message: 'Only one lower-bound operator allowed.' })
      result[operator === '>' ? 'gt' : 'gte'] = value
      hasLowerBound = true
      break
    case '<':
    case '<=':
      if (hasUpperBound)
        throw new BaseErrorHandler.ApiError('Bad Request', { message: 'Only one upper-bound operator allowed.' })
      result[operator === '<' ? 'lt' : 'lte'] = value
      hasUpperBound = true
      break
    }
  }

  if (cleanedExpr.length > 0 && matchedStr !== cleanedExpr) {
    throw new BaseErrorHandler.ApiError('Bad Request', { message: `Malformed input: '${expr}' is not a number` })
  }

  return result
}

export default {
  parseComparisons,
  addNumberFilter,
  addRegexFilter
}
