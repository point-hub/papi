import { describe, expect, it } from 'bun:test'
import { ObjectId } from 'mongodb'

import { MongoDBHelper } from './mongodb-helper'

describe('MongoDBHelper.buildPostData', () => {
  it('1. Should remove top-level undefined, null, empty object, and empty array', () => {
    const rawInput = {
      definedString: 'hello',
      definedNumber: 123,
      propUndefined: undefined,
      propNull: null,
      propEmptyObject: {},
      propEmptyArray: []
    }

    const result = MongoDBHelper.buildPostData(rawInput)

    expect(result).toEqual({
      definedString: 'hello',
      definedNumber: 123
    })
  })

  it('2. Should return an empty object if all input is filtered out', () => {
    const rawInput = {
      a: undefined,
      b: null,
      c: {},
      d: []
    }

    const result = MongoDBHelper.buildPostData(rawInput)

    expect(result).toEqual({})
  })

  it('3. Should handle single non-object/non-array primitive values correctly', () => {
    const rawInput = {
      a: 0,
      b: false,
      c: ''
    }

    const result = MongoDBHelper.buildPostData(rawInput)

    expect(result).toEqual({
      a: 0,
      b: false,
      c: ''
    })
  })

  it('4. Should remove nested empty objects and arrays', () => {
    const rawInput = {
      user: {
        name: 'Alice',
        settings: {},           // Should be removed
        preferences: { theme: 'dark' }
      },
      tags: ['a', 'b', []],       // Inner empty array removed, outer array kept
      notes: { content: null }    // The inner 'content' is removed, causing 'notes' to be removed
    }

    const result = MongoDBHelper.buildPostData(rawInput)

    expect(result).toEqual({
      user: {
        name: 'Alice',
        preferences: { theme: 'dark' }
      },
      tags: ['a', 'b']
    })
    expect(result).not.toHaveProperty('notes')
  })

  it('5. Should handle deep recursion and ensure parents of empty data are removed', () => {
    const rawInput = {
      level1: {
        level2: {
          level3: {
            value: undefined, // Removed
            another: null    // Removed
          },
          data: 'keep'
        },
        emptyNode: {} // Removed
      }
    }

    const result = MongoDBHelper.buildPostData(rawInput)

    expect(result).toEqual({
      level1: {
        level2: {
          data: 'keep'
        }
      }
    })
    // Check that the fully empty 'level3' object was completely omitted
    expect(result.level1.level2).not.toHaveProperty('level3')
  })

  it('6. Should filter null and undefined out of arrays, keeping the array if content remains', () => {
    const rawInput = {
      listA: [1, null, 2, undefined, 3],
      listB: [null, undefined, []] // Inner elements removed, causing listB to be removed
    }

    const result = MongoDBHelper.buildPostData(rawInput)

    expect(result).toEqual({
      listA: [1, 2, 3]
    })
    expect(result).not.toHaveProperty('listB')
  })

  it('7. Should handle objects nested inside arrays', () => {
    const rawInput = {
      items: [
        { id: 1, val: 'a', opt: undefined },
        { id: 2, val: 'b', opt: null },
        { empty: {} } // Object becomes empty, should be removed from the array
      ]
    }

    const result = MongoDBHelper.buildPostData(rawInput)

    expect(result).toEqual({
      items: [
        { id: 1, val: 'a' },
        // Note: { id: 2, val: 'b', opt: null } becomes { id: 2, val: 'b' } because null is filtered inside the object.
        { id: 2, val: 'b' }
      ]
    })
    // Ensure the empty object was removed, reducing the array size to 2
    expect(result.items.length).toBe(2)
  })

  it('8. Should keep Date objects intact', () => {
    const date = new Date()
    const rawInput = {
      createdAt: date,
      updatedAt: null, // Should be removed
      meta: {
        timestamp: date,
        deletedAt: undefined // Should be removed
      }
    }

    const result = MongoDBHelper.buildPostData(rawInput)

    expect(result).toEqual({
      createdAt: date,
      meta: { timestamp: date }
    })
    expect(result.createdAt).toBeInstanceOf(Date)
    expect(result.meta.timestamp).toBeInstanceOf(Date)
  })

  it('9. Should keep ObjectId instances intact', () => {
    const id = new ObjectId()
    const rawInput = {
      _id: id,
      nested: {
        ref: id,
        empty: {}
      }
    }

    const result = MongoDBHelper.buildPostData(rawInput)

    expect(result).toEqual({
      _id: id,
      nested: { ref: id }
    })
    expect(result._id).toBeInstanceOf(ObjectId)
    expect(result.nested.ref).toBeInstanceOf(ObjectId)
  })
})

describe('MongoDBHelper.buildPostManyData', () => {
  const rawDocuments = [
    // Document 1: Perfectly clean, should be kept
    { _id: 'doc1', name: 'Alice', age: 30 },

    // Document 2: Sparse/Partially empty, should be cleaned and kept
    { _id: 'doc2', email: 'b@ex.com', phone: null, address: { street: undefined, city: 'London' } },

    // Document 3: Fully empty after deepFilter, should be removed
    { _id: 'doc3', bio: undefined, tags: [], settings: {} },

    // Document 4: Sparse/Partially empty, contains nested empty data
    { _id: 'doc4', score: 100, metadata: { source: 'api', extra: null } },

    // Document 5: Empty object input, should be removed
    {}
  ]

  it('1. Should correctly clean each document and return a filtered array', () => {
    // We rely on the correctness of deepFilter here.
    const result = MongoDBHelper.buildPostManyData(rawDocuments)

    // Expect 4 documents back (doc5 should be filtered out)
    expect(result.length).toBe(4)

    // Check contents of kept documents
    expect(result[0]).toEqual({
      _id: 'doc1',
      name: 'Alice',
      age: 30
    })

    expect(result[1]).toEqual({
      _id: 'doc2',
      email: 'b@ex.com',
      address: { city: 'London' }
    })

    expect(result[2]).toEqual({
      _id: 'doc3'
    })

    expect(result[3]).toEqual({
      _id: 'doc4',
      score: 100,
      metadata: { source: 'api' }
    })
  })

  it('2. Should return an empty array if the input array is empty', () => {
    const result = MongoDBHelper.buildPostManyData([])

    expect(result).toEqual([])
  })

  it('3. Should return an empty array if all documents are filtered out', () => {
    const sparseInput = [
      { a: null, b: undefined },
      { c: {} },
      { d: [] }
    ]

    const result = MongoDBHelper.buildPostManyData(sparseInput)

    expect(result).toEqual([])
  })

  it('4. Should handle arrays containing complex empty structures', () => {
    const inputWithComplexEmpty = [
      { id: 1, data: [{ item: undefined }] }, // Becomes {id: 1, data: []}, which is then filtered out
      { id: 2, data: 'keep' }
    ]

    const result = MongoDBHelper.buildPostManyData(inputWithComplexEmpty)

    expect(result).toEqual([
      { id: 1 },
      { id: 2, data: 'keep' }
    ])
  })
})

describe('MongoDBHelper.buildPatchData', () => {

  it('1. Should correctly separate $set and $unset operations on top level', () => {
    const rawInput = {
      name: 'Alice', // SET
      email: null, // UNSET
      age: 30, // SET
      phone: undefined // IGNORE
    }

    const result = MongoDBHelper.buildPatchData(rawInput)

    expect(result).toEqual({
      $set: {
        name: 'Alice',
        age: 30
      },
      $unset: {
        email: true
      }
    })

    expect(result.$set).not.toHaveProperty('phone')
  })

  it('2. Should return empty object if input only contains undefined fields', () => {
    const rawInput = {
      name: undefined,
      email: undefined,
      age: undefined
    }

    const result = MongoDBHelper.buildPatchData(rawInput)

    expect(result).toEqual({})
  })

  it('3. Should handle non-string primitive values correctly', () => {
    const rawInput = {
      count: 10,
      isActive: true
    }

    const result = MongoDBHelper.buildPatchData(rawInput)

    expect(result).toEqual({
      $set: {
        count: 10,
        isActive: true
      }
    })
  })


  it('4. Should use dot notation for nested $set operations', () => {
    const rawInput = {
      profile: {
        status: 'online',
        bio: 'coder'
      }
    }

    const result = MongoDBHelper.buildPatchData(rawInput)

    expect(result).toEqual({
      $set: {
        'profile.status': 'online',
        'profile.bio': 'coder'
      }
    })

    // Ensure the parent 'profile' key itself is not added to $set
    expect(result.$set).not.toHaveProperty('profile')
  })

  it('5. Should handle nested $unset operations', () => {
    const rawInput = {
      profile: {
        bio: null, // UNSET nested field
        age: undefined
      },
      settings: null // UNSET parent object
    }

    const result = MongoDBHelper.buildPatchData(rawInput)

    expect(result).toEqual({
      $unset: {
        'profile.bio': true,
        'settings': true
      }
    })
  })

  it('6. Should correctly mix set, unset, and ignore in a nested structure', () => {
    const rawInput = {
      user: {
        name: 'Bob', // SET 'user.name'
        status: null, // UNSET 'user.status'
        role: undefined // IGNORE 'user.role'
      },
      active: true
    }

    const result = MongoDBHelper.buildPatchData(rawInput)

    expect(result).toEqual({
      $set: {
        'user.name': 'Bob',
        active: true
      },
      $unset: {
        'user.status': true
      }
    })
  })

  it('7. Should add arrays to $set as a primitive value (no deep recursion into arrays)', () => {
    const rawInput = {
      tags: ['js', 'ts'],
      history: [{ action: 'login' }],
      deep: {
        data: [1, 2]
      }
    }

    const result = MongoDBHelper.buildPatchData(rawInput)

    expect(result).toEqual({
      $set: {
        'tags': ['js', 'ts'],
        'history': [{ action: 'login' }],
        'deep.data': [1, 2]
      }
    })
  })

  it('8. Should handle deeply nested set/unset/ignore operations', () => {
    const rawInput = {
      lvl1: {
        lvl2: {
          value: 42,
          data: null, // UNSET
          extra: undefined // IGNORE
        },
        id: 100
      }
    }

    const result = MongoDBHelper.buildPatchData(rawInput)

    expect(result).toEqual({
      $set: {
        'lvl1.lvl2.value': 42,
        'lvl1.id': 100
      },
      $unset: {
        'lvl1.lvl2.data': true
      }
    })
  })
})

describe('expandDottedObject', () => {
  it('should expand only the first segment of dotted keys', () => {
    const input = {
      'filter.email_verification.code': 'abcd',
      'user.code': 'abcd'
    }

    const output = MongoDBHelper.expandDottedObject(input)

    expect(output).toEqual({
      filter: {
        'email_verification.code': 'abcd'
      },
      user: {
        code: 'abcd'
      }
    })
  })

  it('should not expand keys without dots', () => {
    const input = {
      filter: '123',
      user: 'abc'
    }

    const output = MongoDBHelper.expandDottedObject(input)

    expect(output).toEqual({
      filter: '123',
      user: 'abc'
    })
  })

  it('should group multiple keys under the same top-level segment', () => {
    const input = {
      'filter.a.b': 1,
      'filter.x.y': 2
    }

    const output = MongoDBHelper.expandDottedObject(input)

    expect(output).toEqual({
      filter: {
        'a.b': 1,
        'x.y': 2
      }
    })
  })

  it('should keep non-filter dotted keys intact', () => {
    const input = {
      'meta.created.at': 'now',
      'meta.updated.at': 'later'
    }

    const output = MongoDBHelper.expandDottedObject(input)

    expect(output).toEqual({
      meta: {
        created: {
          at: 'now'
        },
        updated: {
          at: 'later'
        }
      }
    })
  })

  it('should not perform deep expansion of the nested dotted key', () => {
    const input = {
      'filter.a.b.c': 'value'
    }

    const output = MongoDBHelper.expandDottedObject(input)

    expect(output).toEqual({
      filter: {
        'a.b.c': 'value'
      }
    })
  })

  it('should handle empty object', () => {
    const input = {}

    const output = MongoDBHelper.expandDottedObject(input)

    expect(output).toEqual({})
  })

  it('should preserve non-object values', () => {
    const input = {
      'filter.x.y': null,
      'filter.a.b': 123
    }

    const output = MongoDBHelper.expandDottedObject(input)

    expect(output).toEqual({
      filter: {
        'x.y': null,
        'a.b': 123
      }
    })
  })
})

describe('MongoDBHelper.stringToObjectId', () => {
  it('1. Should convert valid string IDs to ObjectId instances in filter', () => {
    const query = {
      filter: {
        _id: '64b8f0f2e1d3c8a1b2c3d4e5',
        user_id: '64b8f0f2e1d3c8a1b2c3d4e6',
        status: 'active'
      }
    }

    const result = MongoDBHelper.stringToObjectId(query)

    expect(result.filter._id).toBeInstanceOf(ObjectId)
    expect(result.filter.user_id).toBeInstanceOf(ObjectId)
    expect(result.filter.status).toBe('active')
  })

  it('2. Should leave non-string ID fields unchanged', () => {
    const query = {
      filter: {
        _id: 12345,
        user_id: null,
        status: 'inactive'
      }
    }

    const result = MongoDBHelper.stringToObjectId(query)

    expect(result.filter._id).toBe(12345)
    expect(result.filter.user_id).toBeNull()
    expect(result.filter.status).toBe('inactive')
  })

  it('3. Should handle mixed valid and invalid string IDs', () => {
    const query = {
      filter: {
        _id: '64b8f0f2e1d3c8a1b2c3d4e5', // valid
        user_id: 'invalidObjectIdString', // invalid
        group_id: '64b8f0f2e1d3c8a1b2c3d4e7' // valid
      }
    }

    const result = MongoDBHelper.stringToObjectId(query)

    expect(result.filter._id).toBeInstanceOf(ObjectId)
    expect(result.filter.user_id).toBe('invalidObjectIdString')
    expect(result.filter.group_id).toBeInstanceOf(ObjectId)
  })

  it('4. Should return the original query if no filter is present', () => {
    const query = {
      sort: { created_at: -1 },
      limit: 10
    }

    const result = MongoDBHelper.stringToObjectId(query)

    expect(result).toEqual(query)
  })

  it('5. Should not modify the original query object', () => {
    const query = {
      filter: {
        _id: '64b8f0f2e1d3c8a1b2c3d4e5'
      }
    }

    const queryCopy = JSON.parse(JSON.stringify(query))

    MongoDBHelper.stringToObjectId(query)

    expect(query).toEqual(queryCopy)
  })
})
