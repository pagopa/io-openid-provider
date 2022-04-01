import * as mock from "jest-mock-extended";
import { constUndefined, constVoid, pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { makeSessionAdapter, fromAdapterPayload } from "../sessionAdapter";
import { Logger } from "../../../logger";
import { SessionRepository } from "../../../core/repositories/SessionRepository";
import { notImplementedError } from "../utils";
import { sessionPayload } from "./data";
import { Session } from "../../../core/domain";

const makeAdapterForTest = () => {
  const loggerMock = mock.mock<Logger>();
  const sessionRepositoryMock = mock.mock<SessionRepository>();
  const adapter = makeSessionAdapter(loggerMock, sessionRepositoryMock);
  return { loggerMock, sessionRepositoryMock, adapter };
};

describe("makeSessionAdapter", () => {
  it("should return 'not implemented' error useless functions", async () => {
    const id = "id";
    const { adapter } = makeAdapterForTest();

    await expect(adapter.consume(id)).rejects.toThrowError(notImplementedError);
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
      const id = sessionPayload.jti;
      const { sessionRepositoryMock, adapter } = makeAdapterForTest();

      const interaction = pipe(
        fromAdapterPayload(sessionPayload),
        E.fold(constUndefined, (_) => _)
      ) as Session;

      const recorder = sessionRepositoryMock.upsert.mockReturnValueOnce(
        TE.right(interaction)
      );

      await expect(
        adapter.upsert(id, sessionPayload, 123)
      ).resolves.toStrictEqual(constVoid());
      expect(recorder).toBeCalledWith(interaction);
      expect(recorder).toBeCalledTimes(1);
    });
  });
  describe("find", () => {
    it("should call the find function of the given repository", async () => {
      const interaction = pipe(
        fromAdapterPayload(sessionPayload),
        E.fold(constUndefined, (_) => _)
      ) as Session;

      const id = interaction.id;
      const { sessionRepositoryMock, adapter } = makeAdapterForTest();

      const recorder = sessionRepositoryMock.find
        .calledWith(id)
        .mockReturnValueOnce(TE.right(O.some(interaction)));

      await expect(adapter.find(id)).resolves.toStrictEqual(sessionPayload);
      expect(recorder).toBeCalledTimes(1);
    });
  });
  describe("findByUid", () => {
    it("should call the findByUid function of the given repository", async () => {
      const interaction = pipe(
        fromAdapterPayload(sessionPayload),
        E.fold(constUndefined, (_) => _)
      ) as Session;

      const id = interaction.id;
      const { sessionRepositoryMock, adapter } = makeAdapterForTest();

      const recorder = sessionRepositoryMock.findByUid
        .calledWith(id)
        .mockReturnValueOnce(TE.right(O.some(interaction)));

      await expect(adapter.findByUid(id)).resolves.toStrictEqual(
        sessionPayload
      );
      expect(recorder).toBeCalledTimes(1);
    });
  });
  describe("destroy", () => {
    it("should call the remove function of the given repository", async () => {
      const interaction = pipe(
        fromAdapterPayload(sessionPayload),
        E.fold(constUndefined, (_) => _)
      ) as Session;

      const id = interaction.id;
      const { sessionRepositoryMock, adapter } = makeAdapterForTest();

      const recorder = sessionRepositoryMock.remove
        .calledWith(id)
        .mockReturnValueOnce(TE.right(constVoid()));

      await expect(adapter.destroy(id)).resolves.toStrictEqual(constVoid());
      expect(recorder).toBeCalledTimes(1);
    });
  });
});
