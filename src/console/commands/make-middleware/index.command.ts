import fs from "fs";
import path from "path";
import { BaseCommand, Color } from "@point-hub/express-cli";
import { pascalCase, kebabCase } from "@point-hub/express-utils";
import { stubDir } from "@src/console/helper.js";

export default class MakeMiddleware extends BaseCommand {
  constructor() {
    super({
      name: "make:middleware",
      description: "Make a new middleware",
      summary: "Make a new middleware",
      arguments: [
        {
          name: "name",
          description: "Name of middleware",
        },
      ],
      options: [
        {
          type: "boolean",
          flag: "--configurable",
          shorthand: "-c",
          description: "Export a function which accepts an options",
        },
      ],
    });
  }

  async handle(): Promise<void> {
    // Check if middleware directory is already exists
    if (fs.existsSync(`${process.cwd()}/src/middleware/${kebabCase(this.args.name)}`)) {
      console.error(Color.red("Middleware directory is exists"));
      return;
    }

    // Create middleware directory
    fs.mkdirSync(`${process.cwd()}/src/middleware/${kebabCase(this.args.name)}`, { recursive: true });

    // Copy middleware
    if (this.opts["--configurable"]) {
      this.copyConfigureableMiddleware();
    } else {
      this.copyMiddleware();
    }
  }

  private copyMiddleware() {
    // Copy middleware file
    const stubMiddleware = fs
      .readFileSync(path.resolve(stubDir, "./middleware/new.middleware.ts"))
      .toString()
      .replace("NewMiddleware", `${pascalCase(this.args.name)}Middleware`);
    fs.writeFileSync(
      `${process.cwd()}/src/middleware/${kebabCase(this.args.name)}/index.middleware.ts`,
      stubMiddleware
    );

    // Copy test file
    const stubTest = fs
      .readFileSync(path.resolve(stubDir, "./middleware/new.spec.ts"))
      .toString()
      .replace("new.middleware.js", `index.middleware.js`);
    fs.writeFileSync(`${process.cwd()}/src/middleware/${kebabCase(this.args.name)}/index.spec.ts`, stubTest);
  }

  private copyConfigureableMiddleware() {
    // Copy middleware file
    const stubMiddleware = fs
      .readFileSync(path.resolve(stubDir, "./middleware/configurable.middleware.ts"))
      .toString()
      .replace("NewMiddleware", `${pascalCase(this.args.name)}Middleware`);
    fs.writeFileSync(
      `${process.cwd()}/src/middleware/${kebabCase(this.args.name)}/index.middleware.ts`,
      stubMiddleware
    );

    // Copy test file
    const stubTest = fs
      .readFileSync(path.resolve(stubDir, "./middleware/configurable.spec.ts"))
      .toString()
      .replace("configurable.middleware.js", `index.middleware.js`);
    fs.writeFileSync(`${process.cwd()}/src/middleware/${kebabCase(this.args.name)}/index.spec.ts`, stubTest);
  }
}
