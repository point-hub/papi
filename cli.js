#!/usr/bin/env node

import { createRequire } from "module";
import { ExpressCli } from "@point-hub/express-cli";
import { ConsoleKernel } from "./lib/console/index.js";

const require = createRequire(import.meta.url);
const { version } = require("./package.json");

// Initiate CLI
const cli = new ExpressCli("node cli", version);
// Register commands
const kernel = new ConsoleKernel(cli);
await kernel.register();
// Build CLI
cli.run(process.argv);
