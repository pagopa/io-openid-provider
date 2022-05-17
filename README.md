# IO OpenID Provider

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

## Example
Start the server locally:

``` sh
make start.dev
```
1. Add a new client:

``` sh
curl --request POST 'http://localhost:3001/admin/clients' \
--header 'Content-Type: application/json' \
--data-raw '{
  "redirect_uris": [
    "https://callback.io/callback"
  ],
  "organization_id": "my-org",
  "service_id": "my-service",
  "response_types": [
    "id_token"
  ],
  "grant_types": [
    "implicit"
  ],
  "application_type": "web",
  "client_name": "This is the name of this client",
  "scope": "profile openid",
  "token_endpoint_auth_method": "none",
  "id_token_signed_response_alg": "ES256"
}'```

2. Copy from the output the value of `client_id` key.
3. Open the browser on the following endpoint `http://localhost:3001`, and add the following cookie:

```
X-IO-Federation-Token=<any-value>
```

4. In the same browser session paste the following endpoint replacing the `<client_id>` with copied `client_id` value and then :

```
