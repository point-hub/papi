import { BaseCommand } from "@point-hub/express-cli";

export default class NewCommand extends BaseCommand {
  constructor() {
    super({
      name: "[name]",
      description: "[description]",
      summary: "[summary]",
      arguments: [],
      options: [],
    });
  }
  async handle(): Promise<void> {
    //
  }
}
