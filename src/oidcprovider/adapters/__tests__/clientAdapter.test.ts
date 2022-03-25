import * as mock from "jest-mock-extended";
import * as TE from "fp-ts/TaskEither";
import { makeClientAdapter } from "../clientAdapter";
import { Logger } from "../../../logger";
import { ClientRepository } from "../../../core/repositories/ClientRepository";
import { notImplementedError } from "../utils";
import { constVoid } from "fp-ts/lib/function";
import { client } from "../../../core/__tests__/data";

describe("makeClientAdapter", () => {
  it("should override the correct functions", async () => {
    const id = client.client_id;
    const loggerMock = mock.mock<Logger>();
    const clientRepositoryMock = mock.mock<ClientRepository>();
    const adapter = makeClientAdapter(loggerMock, clientRepositoryMock);

    clientRepositoryMock.remove
      .calledWith(id)
      .mockReturnValueOnce(TE.right(constVoid()));
    clientRepositoryMock.find
      .calledWith(id)
      .mockReturnValueOnce(TE.right(client));
    clientRepositoryMock.upsert
      .calledWith(client)
      .mockReturnValueOnce(TE.right(client));

    await expect(adapter.consume(id)).rejects.toThrowError(notImplementedError);
    await expect(adapter.destroy(id)).resolves.toStrictEqual(constVoid());
    await expect(adapter.find(id)).resolves.toStrictEqual(client);
    await expect(adapter.findByUid(id)).rejects.toThrowError(
      notImplementedError
    );
    await expect(adapter.findByUserCode(id)).rejects.toThrowError(
      notImplementedError
    );
    await expect(adapter.revokeByGrantId(id)).rejects.toThrowError(
      notImplementedError
    );
    await expect(adapter.upsert(id, client, 123)).resolves.toStrictEqual(
      constVoid()
    );
  });
  describe("upsert", () => {
    it("should fail given a bad input", async () => {
      const loggerMock = mock.mock<Logger>();
      const clientRepositoryMock = mock.mock<ClientRepository>();
      const adapter = makeClientAdapter(loggerMock, clientRepositoryMock);

      await expect(adapter.upsert("id", {}, 123)).rejects.toThrow();
    });
  });
});
