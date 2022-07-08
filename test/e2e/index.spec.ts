import request from "supertest";
import { createApp } from "@src/app.js";

describe("end to end testing", () => {
  it("create", async () => {
    const app = await createApp();
    const response = await request(app).get("/");
    expect(response.statusCode).toEqual(200);
  });
});
