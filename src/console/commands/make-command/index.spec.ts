import { Color } from '@point-hub/express-cli'
import { beforeAll, describe, expect, it, spyOn } from 'bun:test'
import crypto from 'crypto'
import fs from 'fs'
import shell from 'shelljs'

import MakeCommand from './index.command'

const dir = 'src/console/commands'

function generateRandomName() {
  let exists = true
  let name = 'test'
  while (exists) {
    name = `test-${crypto.randomBytes(4).toString('hex')}`
    exists = fs.existsSync(`${dir}/${name}`)
  }
  return name
}

describe('make:command', () => {
  beforeAll(() => {
    spyOn(console, 'error').mockImplementation(() => '')
    spyOn(console, 'info').mockImplementation(() => '')
  })

  it('should create new command', async () => {
    const makeCommand = new MakeCommand()
    makeCommand.args = {
      name: generateRandomName(),
    }
    const spy = spyOn(makeCommand, 'handle')
    await makeCommand.handle()

    shell.rm('-rf', `${dir}/${makeCommand.args.name}`)

    expect(spy).toHaveBeenCalled()
  })

  it("should return error 'command directory exists'", async () => {
    const makeCommand = new MakeCommand()
    makeCommand.args = {
      name: generateRandomName(),
    }
    const spy = spyOn(makeCommand, 'handle')

    // first attempt it will create new command
    await makeCommand.handle()
    // second attempt it should return error because command directory exists
    await makeCommand.handle()

    shell.rm('-rf', `${dir}/${makeCommand.args.name}`)

    expect(console.error).toHaveBeenCalled()
    expect(console.error).toHaveBeenCalledWith(Color.red('Command directory is exists'))
    expect(spy).toHaveBeenCalled()
  })
})
