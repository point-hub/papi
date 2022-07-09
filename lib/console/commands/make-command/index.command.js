import fs from "fs";
import path from "path";
import { BaseCommand, Color } from "@point-hub/express-cli";
import { pascalCase, kebabCase, camelCase } from "@point-hub/express-utils";
import { stubDir } from "../../../console/helper.js";
export default class MakeCommand extends BaseCommand {
    constructor() {
        super({
            name: "make:command",
            description: "Make a new console command",
            summary: "Make a new console command",
            arguments: [
                {
                    name: "name",
                    description: "Name of console command",
                },
            ],
            options: [],
        });
    }
    async handle() {
        // Check if command directory is already exists
        if (fs.existsSync(`${process.cwd()}/src/console/commands/${kebabCase(this.args.name)}`)) {
            console.error(Color.red("Command directory is exists"));
            return;
        }
        // Create directory
        fs.mkdirSync(`${process.cwd()}/src/console/commands/${kebabCase(this.args.name)}`, { recursive: true });
        // Copy command file
        const stubCommand = fs
            .readFileSync(path.resolve(stubDir, "./command/index.command.ts"))
            .toString()
            .replace("[name]", kebabCase(this.args.name))
            .replace("NewCommand", `${pascalCase(this.args.name)}Command`);
        fs.writeFileSync(`${process.cwd()}/src/console/commands/${kebabCase(this.args.name)}/index.command.ts`, stubCommand);
        // Copy test file
        const stubTest = fs
            .readFileSync(path.resolve(stubDir, "./command/index.spec.ts"))
            .toString()
            .replace(/NewCommand/g, `${pascalCase(this.args.name)}Command`)
            .replace(/newCommand/g, `${camelCase(this.args.name)}Command`);
        fs.writeFileSync(`${process.cwd()}/src/console/commands/${kebabCase(this.args.name)}/index.spec.ts`, stubTest);
        console.info(`src/console/commands/${kebabCase(this.args.name)}/index.command.ts`, "has been created");
        console.info(`src/console/commands/${kebabCase(this.args.name)}/index.spec.ts`, "has been created");
    }
}
