import { Client, ClientId, OrganizationId, ServiceId } from "../types";

const clientId: ClientId = {
  organizationId: "00000000000" as OrganizationId,
  serviceId: "service-id" as ServiceId,
};

export const client: Client = {
  clientId: clientId,
  grantTypes: ["implicit"],
  issuedAt: new Date(),
  name: "This is the client name",
  redirectUris: ["https://callback.cb/cb"],
  responseTypes: ["id_token"],
  scope: "openid profile",
};
