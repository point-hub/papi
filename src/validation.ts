import Validatorjs from 'validatorjs'

import { BaseErrorHandler, type IDocument, type ISchemaValidation } from './index'

// https://github.com/mikeerickson/validatorjs
export const schemaValidation: ISchemaValidation = async (document: IDocument, schema: IDocument) => {
  const validation = new Validatorjs(document, schema)

  if (validation.fails()) {
    throw new BaseErrorHandler.ApiError(422, validation.errors.errors)
  }
}
