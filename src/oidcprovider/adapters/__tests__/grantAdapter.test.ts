import * as mock from "jest-mock-extended";
import { constUndefined, constVoid, pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import {
  fromPayloadAdapter,
  makeGrantAdapter,
  toAdapterPayload,
} from "../grantAdapter";
import { Logger } from "../../../logger";
import { GrantRepository } from "../../../core/repositories/GrantRepository";
import { notImplementedError } from "../utils";
import { grant } from "../../../core/__tests__/data";
import { grantPayload } from "./data";

const makeAdapterForTest = () => {
  const loggerMock = mock.mock<Logger>();
  const grantRepositoryMock = mock.mock<GrantRepository>();
  const adapter = makeGrantAdapter(loggerMock, grantRepositoryMock);
  return { loggerMock, grantRepositoryMock, adapter };
};

describe("makeGrantAdapter", () => {
  it("should return 'not implemented' error useless functions", async () => {
    const id = grant.id;
    const { adapter } = makeAdapterForTest();

    await expect(adapter.destroy(id)).rejects.toThrowError(notImplementedError);
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
      const id = grant.id;
      const { grantRepositoryMock, adapter } = makeAdapterForTest();

      const recorder = grantRepositoryMock.upsert.mockReturnValueOnce(
        TE.right(grant)
      );

      await expect(
        adapter.upsert(id, grantPayload, 123)
      ).resolves.toStrictEqual(constVoid());
      expect(recorder).toBeCalledWith(
        pipe(
          fromPayloadAdapter(grantPayload),
          E.fold(constUndefined, (_) => _)
        )
      );
      expect(recorder).toBeCalledTimes(1);
    });
  });
  describe("find", () => {
    it("should call the find function of the given repository", async () => {
      const id = grant.id;
      const { grantRepositoryMock, adapter } = makeAdapterForTest();

      const recorder = grantRepositoryMock.find
        .calledWith(id)
        .mockReturnValueOnce(TE.right(O.some(grant)));

      await expect(adapter.find(id)).resolves.toStrictEqual(
        toAdapterPayload(grant)
      );
      expect(recorder).toBeCalledTimes(1);
    });
  });
});
