import * as mock from "jest-mock-extended";
import { constUndefined, constVoid, pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import {
  makeInteractionAdapter,
  fromAdapterPayload,
} from "../interactionAdapter";
import { Logger } from "../../../logger";
import { InteractionRepository } from "../../../core/repositories/InteractionRepository";
import { notImplementedError } from "../utils";
import { interactionPayload } from "./data";
import { Interaction } from "../../../core/domain";

const makeAdapterForTest = () => {
  const loggerMock = mock.mock<Logger>();
  const interactionRepositoryMock = mock.mock<InteractionRepository>();
  const adapter = makeInteractionAdapter(loggerMock, interactionRepositoryMock);
  return { loggerMock, interactionRepositoryMock, adapter };
};

describe("makeInteractionAdapter", () => {
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
      const id = interactionPayload.jti;
      const { interactionRepositoryMock, adapter } = makeAdapterForTest();

      const interaction = pipe(
        fromAdapterPayload(interactionPayload),
        E.fold(constUndefined, (_) => _)
      ) as Interaction;

      const recorder = interactionRepositoryMock.upsert.mockReturnValueOnce(
        TE.right(interaction)
      );

      await expect(
        adapter.upsert(id, interactionPayload, 123)
      ).resolves.toStrictEqual(constVoid());
      expect(recorder).toBeCalledWith(interaction);
      expect(recorder).toBeCalledTimes(1);
    });
  });
  describe("find", () => {
    it("should call the find function of the given repository", async () => {
      const interaction = pipe(
        fromAdapterPayload(interactionPayload),
        E.fold(constUndefined, (_) => _)
      ) as Interaction;

      const id = interaction.id;
      const { interactionRepositoryMock, adapter } = makeAdapterForTest();

      const recorder = interactionRepositoryMock.find
        .calledWith(id)
        .mockReturnValueOnce(TE.right(O.some(interaction)));

      await expect(adapter.find(id)).resolves.toStrictEqual(interactionPayload);
      expect(recorder).toBeCalledTimes(1);
    });
  });
  describe("destroy", () => {
    it("should call the remove function of the given repository", async () => {
      const interaction = pipe(
        fromAdapterPayload(interactionPayload),
        E.fold(constUndefined, (_) => _)
      ) as Interaction;

      const id = interaction.id;
      const { interactionRepositoryMock, adapter } = makeAdapterForTest();

      const recorder = interactionRepositoryMock.remove
        .calledWith(id)
        .mockReturnValueOnce(TE.right(constVoid()));

      await expect(adapter.destroy(id)).resolves.toStrictEqual(constVoid());
      expect(recorder).toBeCalledTimes(1);
    });
  });
});
