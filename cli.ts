#!/usr/bin/env node

import { version } from './package.json'
import { BaseConsoleCli } from './src/index'
import { BaseConsoleKernel } from './src/index'

// Initiate CLI
const cli = new BaseConsoleCli('bun cli.ts', version)
// Register commands
const kernel = new BaseConsoleKernel(cli)
await kernel.register()
// Build CLI
cli.run(process.argv)
