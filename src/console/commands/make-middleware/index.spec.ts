import crypto from "crypto";
import fs from "fs";
import { jest } from "@jest/globals";
import { Color } from "@point-hub/express-cli";
import shell from "shelljs";
import MakeMiddlewareCommand from "./index.command.js";

const dir = "src/middleware";

function generateRandomName() {
  let exists = true;
  let name = "test";
  while (exists) {
    name = `test-${crypto.randomBytes(4).toString("hex")}`;
    exists = fs.existsSync(`${dir}/${name}`);
  }
  return name;
}

describe("make:middleware", () => {
  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => "");
  });
  it("should create new middleware", async () => {
    const makeMiddlewareCommand = new MakeMiddlewareCommand();
    makeMiddlewareCommand.args = {
      name: generateRandomName(),
    };
    const spy = jest.spyOn(makeMiddlewareCommand, "handle");
    await makeMiddlewareCommand.handle();

    shell.rm("-rf", `${dir}/${makeMiddlewareCommand.args.name}`);

    expect(spy).toBeCalled();
  });

  it("should create new configureable middleware", async () => {
    const makeMiddlewareCommand = new MakeMiddlewareCommand();
    makeMiddlewareCommand.args = {
      name: generateRandomName(),
    };
    makeMiddlewareCommand.opts = {
      "--configurable": true,
    };
    const spy = jest.spyOn(makeMiddlewareCommand, "handle");
    await makeMiddlewareCommand.handle();

    shell.rm("-rf", `${dir}/${makeMiddlewareCommand.args.name}`);

    expect(spy).toBeCalled();
  });

  it("should return error 'middleware directory exists'", async () => {
    const makeMiddlewareCommand = new MakeMiddlewareCommand();
    makeMiddlewareCommand.args = {
      name: generateRandomName(),
    };
    const spy = jest.spyOn(makeMiddlewareCommand, "handle");

    // first attempt it will create new middleware
    await makeMiddlewareCommand.handle();
    // second attempt it should return error because middleware directory exists
    await makeMiddlewareCommand.handle();

    shell.rm("-rf", `${dir}/${makeMiddlewareCommand.args.name}`);

    expect(console.error).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(Color.red("Middleware directory is exists"));
    expect(spy).toBeCalled();
  });
});
