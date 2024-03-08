import { Logger } from "../domain/logger/index.js";
import { IdentityService } from "../domain/identities/IdentityService.js";
import { InteractionService } from "../domain/interactions/InteractionService.js";
import { ClientService } from "../domain/clients/ClientService.js";
import { GrantService } from "../domain/grants/GrantService.js";
import { Seconds } from "../domain/types/index.js";
import { AbortInteractionUseCase } from "./AbortInteractionUseCase.js";
import { AuthenticateUseCase } from "./AuthenticateUseCase.js";
import { ClientListUseCase } from "./ClientListUseCase.js";
import { ConfirmConsentUseCase } from "./ConfirmConsentUseCase.js";
import { FindGrantUseCase } from "./FindGrantUseCases.js";
import { ProcessInteractionUseCase } from "./ProcessInteractionUseCase.js";
import { RemoveGrantUseCase } from "./RemoveGrantUseCase.js";
import { ListGrantUseCase } from "./ListGrantUseCase.js";

export interface Features {
  readonly grant: {
    readonly grantTTL: Seconds;
    readonly enableRememberGrantFeature: boolean;
  };
}

export const makeUseCases = (
  logger: Logger,
  features: Features,
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
    logger,
    features,
    interactionService,
    grantService
  );
  const findGrantUseCase = FindGrantUseCase(logger, grantService);
  const processInteractionUseCase = ProcessInteractionUseCase(
    logger,
    features,
    identityService,
    interactionService,
    clientService,
    grantService
  );
  const removeGrantUseCase = RemoveGrantUseCase(logger, grantService);
  const listGrantUseCase = ListGrantUseCase(grantService);
  return {
    abortInteractionUseCase,
    authenticateUseCase,
    clientListUseCase,
    confirmConsentUseCase,
    findGrantUseCase,
    listGrantUseCase,
    processInteractionUseCase,
    removeGrantUseCase,
  };
};
export type UseCases = ReturnType<typeof makeUseCases>;
