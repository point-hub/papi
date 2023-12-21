import { Express } from 'express'
import { Server as HttpServer } from 'http'
import { AddressInfo } from 'net'

export class Server {
  app: Express
  server: HttpServer | null = null

  constructor(app: Express) {
    this.app = app
  }

  listen(port: number, hostname?: string) {
    return new Promise((resolve, reject) => {
      if (hostname) {
        this.server = this.app.listen(port, hostname).once('listening', resolve).once('error', reject)
      } else {
        this.server = this.app.listen(port).once('listening', resolve).once('error', reject)
      }
    })
  }

  async start(port: number, hostname?: string) {
    await this.listen(port, hostname)
  }

  stop() {
    this.server?.close()
    this.server = null
  }

  get host() {
    const address = this.server?.address() as AddressInfo
    if (address?.address === '0.0.0.0' || address?.address === '::') {
      return 'localhost'
    } else {
      return address?.address
    }
  }

  get port() {
    const address = this.server?.address() as AddressInfo
    return address?.port
  }

  get url() {
    return `http://${this.host}${this.port !== 80 ? `:${this.port}` : ''}`
  }
}
