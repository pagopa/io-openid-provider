import each from "jest-each";
import * as mock from "jest-mock-extended";
import * as express from "express";
import * as oidc from "oidc-provider";
import * as E from "fp-ts/Either";
import * as interactions from "../service";
import * as phonies from "../../__tests__/utils/phonies";
import * as records from "../../__tests__/utils/records";
import { ErrorType } from "../domain";

describe("ProviderService", () => {
  beforeEach(() => {
    // just a workaround to remove log on tests
    // TODO: Move this on some configuration (jest??)
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("getClient", () => {
    it("should return the client", async () => {
      const { provider, client, logger, mockGrantRepository } =
        phonies.makeFakeApplication();
      const service = interactions.makeService(
        provider,
        mockGrantRepository,
        logger
      );

      const actual = await service.getClient(client.client_id)();
      const expected = E.right({ clientId: client.client_id });

      expect(actual).toMatchObject(expected);
    });
    it("should return client not found", async () => {
      const { provider, logger, mockGrantRepository } =
        phonies.makeFakeApplication();
      const service = interactions.makeService(
        provider,
        mockGrantRepository,
        logger
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
          const { logger, mockGrantRepository } = phonies.makeFakeApplication();
          const mockProvider = mock.mock<oidc.Provider>();
          const service = interactions.makeService(
            mockProvider,
            mockGrantRepository,
            logger
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
