import { jest } from "@jest/globals";
import NewCommand from "./index.command.js";

it("test command", () => {
  const newCommand = new NewCommand();
  const spy = jest.spyOn(newCommand, "handle");
  newCommand.handle();

  expect(spy).toBeCalled();
});
