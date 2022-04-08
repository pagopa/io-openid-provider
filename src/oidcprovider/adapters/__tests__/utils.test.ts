import * as fc from "fast-check";
import * as mock from "jest-mock-extended";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { Logger } from "../../../logger";
import {
  DateFromNumericDate,
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

describe("DateFromNumericDate", () => {
  it("should work as expected", () => {
    fc.assert(
      fc.property(fc.date(), (date) => {
        date.setMilliseconds(0);
        const numericDate = date.getTime() / 1000;

        const decoded = DateFromNumericDate.decode(numericDate);
        const expectedDecoded = E.right(date);
        expect(decoded).toStrictEqual(expectedDecoded);

        const encoded = DateFromNumericDate.encode(date);
        const expectedEncoded = numericDate;
        expect(encoded).toStrictEqual(expectedEncoded);
      })
    );
  });
});
