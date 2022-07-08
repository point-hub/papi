import { ExpressCli } from "@point-hub/express-cli";
export declare class ConsoleKernel {
    path: string;
    private command;
    constructor(command: ExpressCli);
    /**
     * Register the commands for the application.
     *
     * @example
     * command.register(new ExampleCommand());
     */
    register(): Promise<void>;
}
