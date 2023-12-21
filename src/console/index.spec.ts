import { ExpressCli } from '@point-hub/express-cli'
import { expect, it } from 'bun:test'

import { ConsoleKernel } from './index'

it('express cli to be defined', async () => {
  const cli = new ExpressCli('cli', '1.0.0')

  const kernel = new ConsoleKernel(cli)
  await kernel.register()

  expect(cli).toBeDefined()
  expect(cli).toBeInstanceOf(ExpressCli)
})
