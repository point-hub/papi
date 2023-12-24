import { expect, it } from 'bun:test'

import { createApp } from './app'

it('express app to be defined', async () => {
  const app = await createApp()
  expect(app).toBeDefined()
})
