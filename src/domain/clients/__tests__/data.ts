import { Client, ClientId, OrganizationId, ServiceId } from "../types";

export const client: Client = {
  clientId: "client-id" as ClientId,
  grantTypes: ["implicit"],
  issuedAt: new Date(),
  name: "This is the client name",
  organizationId: "00000000000" as OrganizationId,
  redirectUris: ["https://callback.cb/cb"],
  serviceId: "service-id" as ServiceId,
  responseTypes: ["id_token"],
  scope: "openid profile",
};
