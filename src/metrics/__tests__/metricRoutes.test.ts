import { makeTestApplication } from "../../__tests__/utils/testUtils.test";
import request from "supertest";

describe("MetricRoutes", () => {
    describe("GET /metrics", () => {
        test("it should returns plain text with 200 status code",  async () => {
            const application = makeTestApplication();
            const response = await request(application).get("/metrics");

            expect(response.statusCode).toBe(200);
            expect(response.headers["content-type"]).toBe("text/plain; charset=utf-8");
        });
    });
});
