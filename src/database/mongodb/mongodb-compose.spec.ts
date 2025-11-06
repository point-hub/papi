import { describe, expect, it } from 'bun:test'

import { composeUpdate } from './mongodb-compose'

describe('mongodb compose', () => {
  it('compose update', async () => {
    const input = {
      name: '',
      profile: {
        age: 25,
        cv: null,
        bv: undefined,
        skills: [{ name: '', level: 'advanced' }, { name: 'Node', level: '' }, { name: 'Vue' }]
      }
    }

    const output = {
      $set: {
        'profile.age': 25,
        'profile.skills.0.level': 'advanced',
        'profile.skills.1.name': 'Node',
        'profile.skills.2.name': 'Vue'
      },
      $unset: {
        name: '',
        'profile.bv': '',
        'profile.cv': '',
        'profile.skills.0.name': '',
        'profile.skills.1.level': ''
      }
    }

    const result = composeUpdate(input)
    expect(result).toEqual(output)
  })
})
