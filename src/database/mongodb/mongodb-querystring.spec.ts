import { describe, expect, it } from 'bun:test'

import {
  convertArrayToObject,
  convertStringToArray,
  fields,
  filterExludeFields,
  limit,
  page,
  skip,
  sort,
} from './mongodb-querystring'

describe('field', () => {
  it('convert string to array', async () => {
    expect(convertStringToArray('name, password')).toStrictEqual(['name', 'password'])
  })

  it('convert array to mongodb field object', async () => {
    expect(convertArrayToObject(['name', 'password'])).toStrictEqual({
      name: 1,
      password: 1,
    })
  })

  it('add excluded fields to the object', async () => {
    const obj = { name: 1, password: 1 }
    const excluded = ['password']
    const result = {
      ...obj,
      ...filterExludeFields(obj, excluded),
    }
    expect(result).toStrictEqual({
      name: 1,
      password: 0,
    })
  })

  it('filter fields', async () => {
    const result = fields('', ['password'])
    expect(result).toStrictEqual({
      password: 0,
    })
  })
})

describe('page', () => {
  it('convert page string to number', async () => {
    expect(page('1')).toStrictEqual(1)
  })
  it('default page should be 1', async () => {
    expect(page()).toStrictEqual(1)
  })
})

describe('limit', () => {
  it('convert limit string to number', async () => {
    expect(limit('1')).toStrictEqual(1)
  })
  it('default limit should be 10', async () => {
    expect(limit()).toStrictEqual(10)
  })
})

describe('skip', () => {
  it('should skip number of data from page', async () => {
    expect(skip(1, 10)).toStrictEqual(0)
    expect(skip(2, 10)).toStrictEqual(10)
    expect(skip(2, 50)).toStrictEqual(50)
  })
})

describe('sort', () => {
  it('convert string to mongodb sort object', async () => {
    expect(sort('name,-address')).toStrictEqual({
      name: 1,
      address: -1,
    })
  })
})
