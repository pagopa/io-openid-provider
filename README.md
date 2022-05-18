# FIMS

## Install all the dependencies

To install all the dependencies run the following command:

``` sh
yarn install
```

## Useful commands

To run tests:

``` sh
yarn run test
```

To run the server locally:

``` sh
yarn run start
```

To create docker image, move to the directory that contains the Dockerfile and run the following command:

``` sh
make build.image
```

To lint the code:

``` sh
yarn run lint
```

## Environment variables

Those are all Environment variables needed by the application:

| Variable name                 | Description                                                                                                                                                               | type    |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------|
| SERVER_HOSTNAME               | The HOSTNAME the Express server is listening to                                                                                                                           | string  |
| PORT                          | The HTTP port the Express server is listening to                                                                                                                          | string  |
| LOG_LEVEL                     | The level of the logger                                                                                                                                                   | string  |
| APPLICATION_NAME              | The name of the application, used as prefix for the logger                                                                                                                | string  |
| VERSION                       | The version of the service, it should be populated automatically                                                                                                          | string  |
| IO_BACKEND_BASE_URL           | The base URL of IO back-end used as identity provider                                                                                                                     | string  |
| MONGODB_URL                   | The URL used to connect to MongoDB 4.2 compatible                                                                                                                         | string  |
| AUTHENTICATION_COOKIE_KEY     | The cookie key where the authentication token is expected                                                                                                                 | string  |
| GRANT_TTL_IN_SECONDS          | The seconds after which the grant expires                                                                                                                                 | string  |
| ISSUER                        | The Issuer Identifier defined by Open-ID Connect standard: URL using the `https:` scheme with no query or fragment component that the OP asserts as its Issuer Identifier | string  |
| ENABLE_FEATURE_REMEMBER_GRANT | (Optional, default `false`) Enable or disable the feature that allows a user to remember a grant, valid values `true` or `false`                                          | boolean |
| JWK_PRIMARY                   | The JSON Web Key as string                                                                                                                                                | string  |
| JWK_SECONDARY                 | (Optional) A second JSON Web Key as string, this field is useful to rotate the keys                                                                                       | string  |

## Example

The first thing to do before starting the server locally is create a valid JSON Web Key and assign it to the `JWK_PRIMARY` environment variable, you can do it using the following command:

``` sh
curl https://mkjwk.org/jwk/ec\?alg\=ES256\&use\=sig\&gen\=timestamp\&crv\=P-256 | jq -c '.jwk'

// The following command append the JSON Web Key to the end of .env.default file
echo JWK_PRIMARY=$(curl https://mkjwk.org/jwk/ec\?alg\=ES256\&use\=sig\&gen\=timestamp\&crv\=P-256 | jq -c '.jwk') >> .env.default
```

After that the server can be started locally with the following command:

``` sh
// this command starts two container, the database and the server
make start.dev

// this command starts just the database, the server is run with local node
make start.local
```
### Test the flow

1. Add a new client:

``` sh
curl --request POST 'http://localhost:3001/admin/clients' \
--header 'Content-Type: application/json' \
--data-raw '{
  "redirect_uris": [
    "https://callback.pagopa.it/callback"
  ],
  "organization_id": "00000000000",
  "service_id": "my-service",
  "response_types": [
    "id_token"
  ],
  "grant_types": [
    "implicit"
  ],
  "application_type": "web",
  "client_name": "This is the name of this client",
  "scope": "openid name",
  "token_endpoint_auth_method": "none",
  "id_token_signed_response_alg": "ES256"
}'
```

2. Copy from the output the value of the `client_id` key.
3. Open the browser on the following endpoint `http://localhost:3001`, and add the following cookie:

```
X-IO-Federation-Token=<the-token>
```

4. In the same browser session paste the following endpoint replacing the `<client_id>` with copied `client_id` value and then:

```
http://localhost:3001/oauth/authorize?client_id=<client_id>&response_type=id_token&redirect_uri=https://callback.pagopa.it/callback&scope=openid name&response_mode=form_post&state=<state>&nonce=<nonce>
```

## Project structure

The project follows the **Ports and Adapters** architecture pattern (also know as Hexagonal architecture). There are three main folders: *adapters*, *useCases* and *domain*.

* *Domain*: Contains the structure and the interfaces, this folder doesn't import any code from other folder.
* *UseCases*: Contains the use-cases of the system, it depends only on *domain*.
* *Adapters*: Contains the implementations of the interfaces defined into the *domain* folder, moreover, contains the code that adapts the use-cases to external delivery channel (http).

The OpenID Connect features are implemented through the [`node-oidc-provider`](https://github.com/panva/node-oidc-provider/tree/main) library, all the stuff related to it is encapsulated as adapter in [`src/adapters/http/openidConnect/nodeOidcProvider`](https://github.com/pagopa/io-openid-provider/tree/main/src/adapters/http/openidConnect/nodeOidcProvider) folder.
