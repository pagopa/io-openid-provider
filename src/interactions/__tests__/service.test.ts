import each from "jest-each";
import * as mock from "jest-mock-extended";
import * as express from "express";
import * as oidc from "oidc-provider";
import * as E from "fp-ts/Either";
import * as interactions from "../service";
import * as records from "../../__tests__/utils/records";
import { makeLogger } from "../../logger";
import { ErrorType } from "../domain";

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
      const expected = E.right({ clientId: client.client_id });

      expect(actual).toMatchObject(expected);
    });
    it("should return client not found", async () => {
      const { provider } = makeLocalProvider();
      const service = interactions.makeService(
        provider,
        makeLogger(records.validConfig.logger)
      );

      const actual = await service.getClient("doesnt-exist")();
      const expected = E.left({ error: ErrorType.invalidClient });

      expect(actual).toMatchObject(expected);
    });

    describe("getInteraction", () => {
      const base = {
        input: {
          req: {} as express.Request,
          res: {} as express.Response,
        },
      };
      const entries = [
        {
          ...base,
          mocks: {
            interactionDetails: Promise.resolve(records.interactions.login),
          },
          expected: E.right(records.interactions.login),
        },
        {
          ...base,
          mocks: {
            interactionDetails: Promise.resolve(records.interactions.consent),
          },
          expected: E.right(records.interactions.consent),
        },
      ];
      each(entries).it(
        "should return the interaction",
        async ({ input, mocks, expected }) => {
          const mockProvider = mock.mock<oidc.Provider>();
          const service = interactions.makeService(
            mockProvider,
            makeLogger(records.validConfig.logger)
          );

          // mocks behaviour
          mockProvider.interactionDetails.mockReturnValueOnce(
            mocks.interactionDetails
          );
          // end mocks behaviour

          const actual = await service.getInteraction(input.req, input.res)();

          expect(actual).toMatchObject(expected);
        }
      );
    });
  });
});
