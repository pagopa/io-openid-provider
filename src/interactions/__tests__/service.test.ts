import * as oidc from "oidc-provider";
import * as E from "fp-ts/Either";
import * as interactions from "../service";
import * as records from "../../__tests__/utils/records";
import { makeLogger } from "../../logger";

const makeLocalProvider = () => {
  const client: oidc.ClientMetadata = {
    client_id: "client-id",
    grant_types: ["implicit"],
    redirect_uris: ["https://callback/cb"],
    response_types: ["id_token"],
    token_endpoint_auth_method: "none",
  };
  const provider = new oidc.Provider("https://localhost:8000", {
    clients: [client],
  });
  return { provider, client };
};

describe("ProviderService", () => {
  beforeEach(() => {
    // just a workaround to remove log on tests
    // TODO: Move this on some configuration (jest??)
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("getClient", () => {
    it("should return the client", async () => {
      const { provider, client } = makeLocalProvider();
      const service = interactions.makeService(
        provider,
        makeLogger(records.validConfig.logger)
      );

      const actual = await service.getClient(client.client_id)();

      expect(actual).toMatchObject(E.right({ clientId: client.client_id }));
    });
  });
});
