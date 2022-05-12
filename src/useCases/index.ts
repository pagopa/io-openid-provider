import { Logger } from "../domain/logger";
import { IdentityService } from "../domain/identities/IdentityService";
import { InteractionService } from "../domain/interactions/InteractionService";
import { ClientService } from "../domain/clients/ClientService";
import { GrantService } from "../domain/grants/GrantService";
import { Seconds } from "../domain/types";
import { AbortInteractionUseCase } from "./AbortInteractionUseCase";
import { AuthenticateUseCase } from "./AuthenticateUseCase";
import { ClientListUseCase } from "./ClientListUseCase";
import { ConfirmConsentUseCase } from "./ConfirmConsentUseCase";
import { FindGrantUseCase } from "./FindGrantUseCases";
import { ProcessInteractionUseCase } from "./ProcessInteractionUseCase";
import { RemoveGrantUseCase } from "./RemoveGrantUseCase";

export const makeUseCases = (
  grantTTL: Seconds,
  logger: Logger,
  identityService: IdentityService,
  interactionService: InteractionService,
  clientService: ClientService,
  grantService: GrantService
  // eslint-disable-next-line max-params
) => {
  const abortInteractionUseCase = AbortInteractionUseCase(
    logger,
    interactionService
  );
  const authenticateUseCase = AuthenticateUseCase(logger, identityService);
  const clientListUseCase = ClientListUseCase(logger, clientService);
  const confirmConsentUseCase = ConfirmConsentUseCase(
    grantTTL,
    logger,
    interactionService,
    grantService
  );
  const findGrantUseCase = FindGrantUseCase(logger, grantService);
  const processInteractionUseCase = ProcessInteractionUseCase(
    logger,
    identityService,
    interactionService,
    clientService,
    grantService
  );
  const removeGrantUseCase = RemoveGrantUseCase(logger, grantService);
  return {
    abortInteractionUseCase,
    authenticateUseCase,
    clientListUseCase,
    confirmConsentUseCase,
    findGrantUseCase,
    processInteractionUseCase,
    removeGrantUseCase,
  };
};
export type UseCases = ReturnType<typeof makeUseCases>;
