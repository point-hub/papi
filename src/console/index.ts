import { ExpressCli } from '@point-hub/express-cli'

import MakeCommand from './commands/make-command/index.command'
import MakeMiddleware from './commands/make-middleware/index.command'

export class ConsoleKernel {
  private command: ExpressCli

  constructor(command: ExpressCli) {
    this.command = command
  }

  /**
   * Register the commands for the application.
   *
   * @example
   * this.command.register(new ExampleCommand());
   */
  async register() {
    this.command.register(new MakeCommand())
    this.command.register(new MakeMiddleware())
  }
}
