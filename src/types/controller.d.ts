/* eslint-disable @typescript-eslint/no-explicit-any */
interface IHttpRequest {
  [key: string]: any
}

interface IControllerInput {
  httpRequest: IHttpRequest
  dbConnection: IDatabase
}

interface IController {
  (input: IControllerInput): Promise<IControllerOutput>
}

interface IControllerOutput {
  status: number
  json?: any
}
