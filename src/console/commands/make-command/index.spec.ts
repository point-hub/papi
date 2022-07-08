import crypto from "crypto";
import fs from "fs";
import { jest } from "@jest/globals";
import { Color } from "@point-hub/express-cli";
import shell from "shelljs";
import MakeCommand from "./index.command.js";

const dir = "src/console/commands";

function generateRandomName() {
  let exists = true;
  let name = "test";
  while (exists) {
    name = `test-${crypto.randomBytes(4).toString("hex")}`;
    exists = fs.existsSync(`${dir}/${name}`);
  }
  return name;
}

describe("make:command", () => {
  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => "");
  });

  it("should create new command", async () => {
    const makeCommand = new MakeCommand();
    makeCommand.args = {
      name: generateRandomName(),
    };
    const spy = jest.spyOn(makeCommand, "handle");
    await makeCommand.handle();

    shell.rm("-rf", `${dir}/${makeCommand.args.name}`);

    expect(spy).toBeCalled();
  });

  it("should return error 'command directory exists'", async () => {
    const makeCommand = new MakeCommand();
    makeCommand.args = {
      name: generateRandomName(),
    };
    const spy = jest.spyOn(makeCommand, "handle");

    // first attempt it will create new command
    await makeCommand.handle();
    // second attempt it should return error because command directory exists
    await makeCommand.handle();

    shell.rm("-rf", `${dir}/${makeCommand.args.name}`);

    expect(console.error).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(Color.red("Command directory is exists"));
    expect(spy).toBeCalled();
  });
});
