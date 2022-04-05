import * as mock from "jest-mock-extended";
import { constUndefined, pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { makeClientAdapter, fromAdapterPayload } from "../clientAdapter";
import { Logger } from "../../../logger";
import { ClientRepository } from "../../../core/repositories/ClientRepository";
import { notImplementedError } from "../utils";
import { constVoid } from "fp-ts/lib/function";
import { clientPayload } from "./data";
import { Client } from "../../../core/domain";

const makeAdapterForTest = () => {
  const loggerMock = mock.mock<Logger>();
  const clientRepositoryMock = mock.mock<ClientRepository>();
  const adapter = makeClientAdapter(loggerMock, clientRepositoryMock);
  return { loggerMock, clientRepositoryMock, adapter };
};

describe("makeClientAdapter", () => {
  it("should return 'not implemented' error useless functions", async () => {
    const id = "id";
    const { adapter } = makeAdapterForTest();

    await expect(adapter.consume(id)).rejects.toThrowError(notImplementedError);
    await expect(adapter.findByUid(id)).rejects.toThrowError(
      notImplementedError
    );
    await expect(adapter.findByUserCode(id)).rejects.toThrowError(
      notImplementedError
    );
    await expect(adapter.revokeByGrantId(id)).rejects.toThrowError(
      notImplementedError
    );
  });
  describe("upsert", () => {
    it("should fail given a bad input", async () => {
      const { adapter } = makeAdapterForTest();

      await expect(adapter.upsert("id", {}, 123)).rejects.toThrow();
    });
    it("should call the upsert function of the given repository", async () => {
      const id = clientPayload.client_id;
      const { clientRepositoryMock, adapter } = makeAdapterForTest();

      const client = pipe(
        fromAdapterPayload(clientPayload),
        E.fold(constUndefined, (_) => _)
      ) as Client;

      const recorder = clientRepositoryMock.upsert
        .mockReturnValueOnce(TE.right(client));

      await expect(adapter.upsert(id, clientPayload, 123)).resolves.toStrictEqual(
        constVoid()
      );
      expect(recorder).toBeCalledWith(client);
      expect(recorder).toBeCalledTimes(1);
    });
  });
  describe("find", () => {
    it("should call the find function of the given repository", async () => {
      const client = pipe(
        fromAdapterPayload(clientPayload),
        E.fold(constUndefined, (_) => _)
      ) as Client;
      const id = client.clientId;
      const { clientRepositoryMock, adapter } = makeAdapterForTest();

      const recorder = clientRepositoryMock.find
        .calledWith(id)
        .mockReturnValueOnce(TE.right(O.some(client)));

      await expect(adapter.find(id)).resolves.toStrictEqual(clientPayload);
      expect(recorder).toBeCalledTimes(1);
    });
  });
  describe("destroy", () => {
    it("should call the remove function of the given repository", async () => {
      const client = pipe(
        fromAdapterPayload(clientPayload),
        E.fold(constUndefined, (_) => _)
      ) as Client;
      const id = client.clientId;
      const { clientRepositoryMock, adapter } = makeAdapterForTest();

      const recorder = clientRepositoryMock.remove
        .calledWith(id)
        .mockReturnValueOnce(TE.right(constVoid()));

      await expect(adapter.destroy(id)).resolves.toStrictEqual(constVoid());
      expect(recorder).toBeCalledTimes(1);
    });
  });
});
