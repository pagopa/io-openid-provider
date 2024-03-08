import * as authClient from "../../generated/clients/io-auth/client.js";

export interface IOClientConfig {
  readonly baseURL: URL;
}

/**
 * Create IO clients
 */
const makeIOClients = (config: IOClientConfig, fetchAPI: typeof fetch) => {
  const ioAuthClient = authClient.createClient({
    baseUrl: config.baseURL.href,
    fetchApi: fetchAPI,
  });
  return { ioAuthClient };
};

export { makeIOClients };
