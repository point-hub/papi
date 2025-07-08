import { describe, expect, it } from 'bun:test'

import { addNumberFilter, addRegexFilter, parseComparisons } from './mongodb-query-filters'

describe('addRegexFilter', () => {
  it('adds regex filter when value is provided', () => {
    const filters: Record<string, unknown>[] = []
    addRegexFilter(filters, 'name', 'john')
    expect(filters).toEqual([{ name: { $regex: 'john', $options: 'i' } }])
  })

  it('does not add filter for empty or whitespace string', () => {
    const filters: Record<string, unknown>[] = []
    addRegexFilter(filters, 'name', '   ')
    expect(filters).toEqual([])
  })
})

describe('addNumberFilter', () => {
  it('adds equality filter for plain number string', () => {
    const filters: Record<string, unknown>[] = []
    addNumberFilter(filters, 'age', '25')
    expect(filters).toEqual([{ age: 25 }])
  })

  it('adds $gt and $lt filter', () => {
    const filters: Record<string, unknown>[] = []
    addNumberFilter(filters, 'age', '>20<30')
    expect(filters).toEqual([{ age: { $gt: 20, $lt: 30 } }])
  })

  it('adds only one operator', () => {
    const filters: Record<string, unknown>[] = []
    addNumberFilter(filters, 'age', '>=18')
    expect(filters).toEqual([{ age: { $gte: 18 } }])
  })

  it('does not add filter for empty string', () => {
    const filters: Record<string, unknown>[] = []
    addNumberFilter(filters, 'age', '')
    expect(filters).toEqual([])
  })
})

describe('parseComparisons', () => {
  it('parses plain number as equality', () => {
    expect(parseComparisons('42')).toEqual({ eq: 42 })
  })

  it('parses single gt and lt', () => {
    expect(parseComparisons('>5<10')).toEqual({ gt: 5, lt: 10 })
  })

  it('parses single gte and lte', () => {
    expect(parseComparisons('>=15<=30')).toEqual({ gte: 15, lte: 30 })
  })

  it('throws on malformed input', () => {
    expect(() => parseComparisons('>>5')).toThrow()
    expect(() => parseComparisons('abc')).toThrow()
    expect(() => parseComparisons('>5>6')).toThrow()
    expect(() => parseComparisons('<10<5')).toThrow()
  })
})
