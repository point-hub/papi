import { URL } from "url";
import { fileSearch } from "@point-hub/express-utils";
export class ConsoleKernel {
    constructor(command) {
        this.path = new URL(".", import.meta.url).pathname;
        this.command = command;
    }
    /**
     * Register the commands for the application.
     *
     * @example
     * command.register(new ExampleCommand());
     */
    async register() {
        const result = await fileSearch("/*.command.(js|ts)", this.path, { maxDeep: 2, regExp: true });
        for (let i = 0; i < result.length; i++) {
            const { default: Command } = await import(`./${result[i].path}`);
            this.command.register(new Command());
        }
    }
}
