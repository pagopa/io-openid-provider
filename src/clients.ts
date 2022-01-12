import * as authClient from "./generated/clients/io-auth/client";
import * as fetch from "./utils/fetch";

interface IOClientConfig {
  // "https://app-backend.io.italia.it/",
  readonly baseUrl: URL;
}

const makeAuthClient = (config: IOClientConfig): authClient.Client =>
  authClient.createClient({
    basePath: "",
    baseUrl: config.baseUrl.href,
    fetchApi: fetch.timeoutFetch,
  });

export { makeAuthClient };
