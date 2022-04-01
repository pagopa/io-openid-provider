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
docker build -t openid-provider .
```

To lint the code:

``` sh
yarn run lint
```

## Environment variables

Those are all Environment variables needed by the application:

| Variable name       | Description                                                      | type   |
|---------------------|------------------------------------------------------------------|--------|
| SERVER_HOSTNAME     | The HOSTNAME the Express server is listening to                  | string |
| PORT                | The HTTP port the Express server is listening to                 | string |
| LOG_LEVEL           | The level of the logger                                          | string |
| APPLICATION_NAME    | The name of the application, used as prefix for the logger       | string |
| VERSION             | The version of the service, it should be populated automatically | string |
| IO_BACKEND_BASE_URL | The base URL of IO backend used as identity provider             | string |
| POSTGRES_URL        | The URL used to connect to PostgreSQL                            | string |


## Example
Start the server locally:

``` sh
make start.dev
```
1. Add a new client:

``` sh
curl --location --request POST 'http://localhost:3000/connect/register' \
--header 'Content-Type: application/json' \
--data-raw '{
   "redirect_uris":
     ["https://client.example.org/callback"],
   "client_name": "This is a test client",
   "grant_types": ["implicit"],
   "response_types": ["id_token"],
   "token_endpoint_auth_method": "none",
   "scope": "openid profile"
}'
```

2. Copy from the output the value of `client_id` key.
3. Open the browser on the following endpoint `http://localhost:3000`, and add the following cookie:

```
X-IO-Federation-Token=<any-value>
```

4. In the same browser session paste the following endpoint replacing the `<client_id>` with copied `client_id` value and then :

```
http://localhost:3000/oauth/authorize?client_id=<client_id>&response_type=id_token&redirect_uri=https://client.example.org/callback&scope=openid&state=<state>&nonce=<nonce>
```
