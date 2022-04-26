import * as koa from "koa";
import * as oidc from "oidc-provider";

/**
 * On routes about client management this middleware add to
 * authorization header a Bearer token where the token is
 * the clientId taken from the url.
 */
export const disableAuthClientsEndpointMiddleware =
  (config: oidc.Configuration): koa.Middleware =>
  (ctx, next) => {
    const registrationUrl = config.routes?.registration;
    if (registrationUrl && ctx.url.startsWith(`${registrationUrl}/`)) {
      const clientId = ctx.url.replace(`${registrationUrl}/`, "");
      if (clientId !== "") {
        // eslint-disable-next-line functional/immutable-data
        ctx.headers.authorization = `Bearer ${clientId}`;
      }
    }
    return next();
  };
