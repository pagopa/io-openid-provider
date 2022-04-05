import { AccountId, Client, ClientId, Grant, GrantId, OrganizationId, ServiceId } from "../domain";

export const client: Client = {
  applicationType: "web",
  bypassConsent: false,
  clientId: "client-id" as ClientId,
  grantTypes: ["implicit"],
  idTokenSignedResponseAlg: "ES384",
  issuedAt: new Date(),
  name: "Client casual name",
  organizationId: "organization-id" as OrganizationId,
  postLogoutRedirectUris: [],
  redirectUris: ["https://callback.io/callback"],
  requireAuthTime: false,
  responseTypes: ["id_token"],
  scope: "openid profile",
  secret: undefined,
  serviceId: "service-id" as ServiceId,
  subjectType: "public",
  tokenEndpointAuthMethod: "none",
};

export const grant: Grant = {
  accountId: "account-id" as AccountId,
  clientId: "client-id" as ClientId,
  expireAt: new Date(),
  id: "grant-id" as GrantId,
  issuedAt: new Date(),
  scope: "openid profile",
};
