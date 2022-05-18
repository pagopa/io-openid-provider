import { Logger } from "../domain/logger";
import { IdentityService } from "../domain/identities/IdentityService";
import { InteractionService } from "../domain/interactions/InteractionService";
import { ClientService } from "../domain/clients/ClientService";
import { GrantService } from "../domain/grants/GrantService";
import { Seconds } from "../domain/types";
import { AbortInteractionUseCase } from "./AbortInteractionUseCase";
import { AuthenticateUseCase } from "./AuthenticateUseCase";
import { ConfirmConsentUseCase } from "./ConfirmConsentUseCase";
import { FindGrantUseCase } from "./FindGrantUseCases";
import { ProcessInteractionUseCase } from "./ProcessInteractionUseCase";
import { RemoveGrantUseCase } from "./RemoveGrantUseCase";
import { ListGrantUseCase } from "./ListGrantUseCase";

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
    confirmConsentUseCase,
    findGrantUseCase,
    listGrantUseCase,
    processInteractionUseCase,
    removeGrantUseCase,
  };
};
export type UseCases = ReturnType<typeof makeUseCases>;
