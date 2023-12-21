import { expect, it, spyOn } from 'bun:test'

import NewCommand from './index.command'

it('test command', () => {
  const newCommand = new NewCommand()
  const spy = spyOn(newCommand, 'handle')
  newCommand.handle()

  expect(spy).toHaveBeenCalled()
})
