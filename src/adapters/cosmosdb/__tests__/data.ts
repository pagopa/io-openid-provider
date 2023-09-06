import { CosmosResource } from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";

export const aCosmosResourceMetadata: Omit<CosmosResource, "id"> = {
  _etag: "_etag",
  _rid: "_rid",
  _self: "_self",
  _ts: 1,
};
