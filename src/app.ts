import express, { Express, Request, Response } from 'express'

export async function createApp() {
  const app: Express = express()

  app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
      message: 'Papi'
    })
  })

  return app
}
