import { BaseCommand, Color } from '@point-hub/express-cli'
import { kebabCase, pascalCase } from '@point-hub/express-utils'
import fs from 'fs'
import path from 'path'

import { stubDir } from '../../../index'

export default class MakeMiddleware extends BaseCommand {
  constructor() {
    super({
      name: 'make:middleware',
      description: 'Make a new middleware',
      summary: 'Make a new middleware',
      arguments: [
        {
          name: 'name',
          description: 'Name of middleware'
        }
      ],
      options: [
        {
          type: 'boolean',
          flag: '--configurable',
          shorthand: '-c',
          description: 'Export a function which accepts an options'
        }
      ]
    })
  }

  async handle(): Promise<void> {
    // Check if middleware directory is already exists
    if (fs.existsSync(`${process.cwd()}/src/middleware/${kebabCase(this.args.name)}`)) {
      console.error(Color.red('Middleware directory is exists'))
      return
    }

    // Create middleware directory
    fs.mkdirSync(`${process.cwd()}/src/middleware/${kebabCase(this.args.name)}`, { recursive: true })

    // Copy middleware
    if (this.opts['--configurable']) {
      this.copyConfigureableMiddleware()
    } else {
      this.copyMiddleware()
    }
  }

  private copyMiddleware() {
    // Copy middleware file
    const stubMiddleware = fs
      .readFileSync(path.resolve(stubDir, './middleware/new.middleware.ts'))
      .toString()
      .replace('NewMiddleware', `${pascalCase(this.args.name)}Middleware`)
    fs.writeFileSync(`${process.cwd()}/src/middleware/${kebabCase(this.args.name)}/index.middleware.ts`, stubMiddleware)

    // Copy test file
    const stubTest = fs
      .readFileSync(path.resolve(stubDir, './middleware/new.spec.ts'))
      .toString()
      .replace('new.middleware.ts', 'index.middleware.ts')
    fs.writeFileSync(`${process.cwd()}/src/middleware/${kebabCase(this.args.name)}/index.spec.ts`, stubTest)

    console.info(`src/middleware/${kebabCase(this.args.name)}/index.middleware.ts`, 'has been created')
    console.info(`src/middleware/${kebabCase(this.args.name)}/index.spec.ts`, 'has been created')
  }

  private copyConfigureableMiddleware() {
    // Copy middleware file
    const stubMiddleware = fs
      .readFileSync(path.resolve(stubDir, './middleware/configurable.middleware.ts'))
      .toString()
      .replace('NewMiddleware', `${pascalCase(this.args.name)}Middleware`)
    fs.writeFileSync(`${process.cwd()}/src/middleware/${kebabCase(this.args.name)}/index.middleware.ts`, stubMiddleware)

    // Copy test file
    const stubTest = fs
      .readFileSync(path.resolve(stubDir, './middleware/configurable.spec.ts'))
      .toString()
      .replace('configurable.middleware.ts', 'index.middleware.ts')
    fs.writeFileSync(`${process.cwd()}/src/middleware/${kebabCase(this.args.name)}/index.spec.ts`, stubTest)

    console.info(`src/middleware/${kebabCase(this.args.name)}/index.middleware.ts`, 'has been created')
    console.info(`src/middleware/${kebabCase(this.args.name)}/index.spec.ts`, 'has been created')
  }
}
