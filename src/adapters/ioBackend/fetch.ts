import { agent } from "@pagopa/ts-commons";
import * as fetch from "@pagopa/ts-commons/lib/fetch";
import { Millisecond } from "@pagopa/ts-commons/lib/units";

// HTTP external requests timeout in milliseconds
const DEFAULT_REQUEST_TIMEOUT_MS = 10000;

// @see https://github.com/pagopa/io-ts-commons/blob/master/src/agent.ts#L10
const apiFetch = agent.getFetch(process.env);

// a fetch that can be aborted and that gets cancelled after fetchTimeoutMs
const abortableFetch = fetch.AbortableFetch(apiFetch);

const timeoutFetch = fetch.toFetch(
  fetch.setFetchTimeout(
    DEFAULT_REQUEST_TIMEOUT_MS as Millisecond,
    abortableFetch
  )
);

export { timeoutFetch };
