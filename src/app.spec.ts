import { createApp } from "@src/app.js";

it("express app to be defined", async () => {
  const app = await createApp();
  expect(app).toBeDefined();
});
