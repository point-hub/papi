import { Color } from '@point-hub/express-cli';
import { afterEach, beforeAll, describe, expect, it, spyOn } from 'bun:test';
import crypto from 'crypto';
import fs from 'fs';
import shell from 'shelljs';

import MakeMiddlewareCommand from './index.command';

const dir = `${process.cwd()}/src/middleware`;

const createdDirectories: string[] = [];

function generateRandomName(): string {
  let name: string;

  do {
    name = `test-${crypto.randomBytes(4).toString('hex')}`;
  } while (fs.existsSync(`${dir}/${name}`));

  return name;
}

function createCommand(name: string, configurable = false) {
  const command = new MakeMiddlewareCommand();

  command.args = { name };
  command.opts = {
    '--configurable': configurable,
  };

  return command;
}

function cleanup(name: string) {
  shell.rm('-rf', `${dir}/${name}`);
}

describe('make:middleware', () => {
  beforeAll(() => {
    spyOn(console, 'error').mockImplementation(() => {});
    spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    for (const directory of createdDirectories) {
      cleanup(directory);
    }

    createdDirectories.length = 0;
  });

  it('should create new middleware', async () => {
    const name = generateRandomName();
    createdDirectories.push(name);

    const command = createCommand(name);

    await command.handle();

    const middlewarePath = `${dir}/${name}/index.middleware.ts`;
    const testPath = `${dir}/${name}/index.spec.ts`;

    expect(fs.existsSync(middlewarePath)).toBe(true);
    expect(fs.existsSync(testPath)).toBe(true);

    const middleware = fs.readFileSync(middlewarePath, 'utf-8');
    expect(middleware).not.toBe('');
  });

  it('should create new configurable middleware', async () => {
    const name = generateRandomName();
    createdDirectories.push(name);

    const command = createCommand(name, true);

    await command.handle();

    const middlewarePath = `${dir}/${name}/index.middleware.ts`;
    const testPath = `${dir}/${name}/index.spec.ts`;

    expect(fs.existsSync(middlewarePath)).toBe(true);
    expect(fs.existsSync(testPath)).toBe(true);

    const middleware = fs.readFileSync(middlewarePath, 'utf-8');

    expect(middleware).not.toBe('');
  });

  it('should return error when middleware directory exists', async () => {
    const name = generateRandomName();
    createdDirectories.push(name);

    const command = createCommand(name);

    await command.handle();

    const consoleError = spyOn(console, 'error');

    await command.handle();

    expect(consoleError).toHaveBeenCalledWith(
      Color.red('Middleware directory is exists'),
    );
  });
});
