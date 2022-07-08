import { BaseCommand } from "@point-hub/express-cli";
export default class MakeMiddleware extends BaseCommand {
    constructor();
    handle(): Promise<void>;
    private copyMiddleware;
    private copyConfigureableMiddleware;
}
