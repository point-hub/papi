export class Server {
    constructor(app) {
        this.server = null;
        this.app = app;
    }
    listen(port, hostname) {
        return new Promise((resolve, reject) => {
            if (hostname) {
                this.server = this.app.listen(port, hostname).once("listening", resolve).once("error", reject);
            }
            else {
                this.server = this.app.listen(port).once("listening", resolve).once("error", reject);
            }
        });
    }
    async start(port, hostname) {
        try {
            await this.listen(port, hostname);
        }
        catch (error) {
            throw error;
        }
    }
    stop() {
        var _a;
        (_a = this.server) === null || _a === void 0 ? void 0 : _a.close();
        this.server = null;
    }
    get host() {
        var _a;
        const address = (_a = this.server) === null || _a === void 0 ? void 0 : _a.address();
        if ((address === null || address === void 0 ? void 0 : address.address) === "0.0.0.0" || (address === null || address === void 0 ? void 0 : address.address) === "::") {
            return "localhost";
        }
        else {
            return address === null || address === void 0 ? void 0 : address.address;
        }
    }
    get port() {
        var _a;
        const address = (_a = this.server) === null || _a === void 0 ? void 0 : _a.address();
        return address === null || address === void 0 ? void 0 : address.port;
    }
    get url() {
        return `http://${this.host}${this.port !== 80 ? `:${this.port}` : ""}`;
    }
}
