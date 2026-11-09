#!/usr/bin/env node

import { version } from './package.json'
import { ConsoleKernel, ExpressCli } from './src/index'

// Initiate CLI
const cli = new ExpressCli('bun cli.ts', version)
// Register commands
const kernel = new ConsoleKernel(cli)
await kernel.register()
// Build CLI
cli.run(process.argv)
