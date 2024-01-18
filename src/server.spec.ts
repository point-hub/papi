import { describe, expect, it } from 'bun:test'

import { createApp } from './app'
import { BaseServer as Server } from './index'

const port = 4000

describe('server', () => {
  it('server should start on http://localhost:port', async () => {
    const server = new Server(await createApp())

    await server.start(port)

    expect(server.host).toEqual('localhost')
    expect(server.port).toEqual(port)
    expect(server.url).toEqual(`http://localhost:${port}`)

    server.stop()
  })

  it('get.url should not print out port if port = 80', async () => {
    const server = new Server(await createApp())

    await server.start(80)

    expect(server.url).toEqual(`http://localhost`)

    server.stop()
  })

  it('get.host return original ip', async () => {
    const server = new Server(await createApp())
    await server.start(port, '127.0.0.1')
    expect(server.host).toEqual('127.0.0.1')
    server.stop()
  })

  it('get.host return localhost', async () => {
    const server = new Server(await createApp())
    await server.start(port)
    expect(server.host).toEqual('localhost')
    server.stop()
  })

  it('not listening server should return undefined', async () => {
    const server = new Server(await createApp())
    server.stop()
    expect(server.host).toBeUndefined()
    expect(server.port).toBeUndefined()
    expect(server.url).toEqual('http://undefined:undefined')
  })

  it('using port that already in use return error', async () => {
    const server1 = new Server(await createApp())
    const server2 = new Server(await createApp())

    try {
      await server1.start(port)

      // start another server using same port to invoke error
      await server2.start(port)
    } catch (error) {
      expect(error).toBeDefined()
      server1.stop()
      server2.stop()
    }
  })
})
