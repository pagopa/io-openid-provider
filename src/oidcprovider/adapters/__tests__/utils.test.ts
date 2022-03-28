import * as mock from "jest-mock-extended";
import * as TE from "fp-ts/TaskEither";
import { Logger } from "../../../logger";
import {
  makeNotImplementedAdapter,
  notImplementedError,
  taskEitherToPromise,
} from "../utils";
import { DomainErrorTypes } from "../../../core/domain";

describe("taskEitherToPromise", () => {
  it("should collapse a TE in a promise", async () => {
    await expect(taskEitherToPromise(TE.right(2))).resolves.toStrictEqual(2);
    await expect(
      taskEitherToPromise(
        TE.left({
          causedBy: notImplementedError,
          kind: DomainErrorTypes.GENERIC_ERROR,
        })
      )
    ).rejects.toThrowError(notImplementedError);
  });
});

describe("makeNotImplementedAdapter", () => {
  it("should implements all functions", async () => {
    const id = "id";
    const loggerMock = mock.mock<Logger>();
    const adapter = makeNotImplementedAdapter("Test", loggerMock);

    await expect(adapter.consume(id)).rejects.toThrowError(notImplementedError);
    await expect(adapter.destroy(id)).rejects.toThrowError(notImplementedError);
    await expect(adapter.find(id)).rejects.toThrowError(notImplementedError);
    await expect(adapter.findByUid(id)).rejects.toThrowError(
      notImplementedError
    );
    await expect(adapter.findByUserCode(id)).rejects.toThrowError(
      notImplementedError
    );
    await expect(adapter.revokeByGrantId(id)).rejects.toThrowError(
      notImplementedError
    );
    await expect(adapter.upsert(id, {}, 123)).rejects.toThrowError(
      notImplementedError
    );
  });
});
