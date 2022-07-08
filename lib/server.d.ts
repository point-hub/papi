/// <reference types="node" />
import { Server as HttpServer } from "http";
import { Express } from "express";
export declare class Server {
    app: Express;
    server: HttpServer | null;
    constructor(app: Express);
    listen(port: number, hostname?: string): Promise<unknown>;
    start(port: number, hostname?: string): Promise<void>;
    stop(): void;
    get host(): string;
    get port(): number;
    get url(): string;
}
