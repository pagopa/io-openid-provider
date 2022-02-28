import * as authClient from "../generated/clients/io-auth/client";

// Create all IO clients required by application
const makeIOClients = (baseUrl: URL, fetchAPI: typeof fetch) => {
  const ioAuthClient = authClient.createClient({
    baseUrl: baseUrl.href,
    fetchApi: fetchAPI,
  });
  return { ioAuthClient };
};

export { makeIOClients };
