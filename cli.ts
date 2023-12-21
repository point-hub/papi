#!/usr/bin/env node

import { ExpressCli } from '@point-hub/express-cli'

import { ConsoleKernel } from './lib/index'
import { version } from './package.json'

// Initiate CLI
const cli = new ExpressCli('bun cli.ts', version)
// Register commands
const kernel = new ConsoleKernel(cli)
await kernel.register()
// Build CLI
cli.run(process.argv)
