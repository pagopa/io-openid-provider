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

/**
 * This middleware removes some fields from the discovery endpoint response
 * that cannot be edited from the node-oidc-provider configuration.
 */
export const updateDiscoveryResponseMiddleware: koa.Middleware = async (
  ctx,
  next
) => {
  await next();
  if (ctx.oidc?.route === "discovery") {
    // The system at the moment doesn't expose to internel
    // the token endpoint but we can't disable it from configuration
    // eslint-disable-next-line functional/immutable-data
    ctx.body.token_endpoint = undefined;
    // The system provides the registration endpoint but for
    // internal use only, this is why it is removed here
    // eslint-disable-next-line functional/immutable-data
    ctx.body.registration_endpoint = undefined;
  }
};
