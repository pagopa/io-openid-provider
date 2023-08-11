export interface MongoDBConfig {
  readonly connectionString: URL;
}

export interface CosmosDBConfig {
  readonly cosmosDbUri: string;
  readonly masterKey: string;
  readonly cosmosDbName: string;
}
