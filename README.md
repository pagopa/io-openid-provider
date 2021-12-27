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

| Variable name    | Description                                                | type   |
|------------------|------------------------------------------------------------|--------|
| SERVER_HOSTNAME  | The HOSTNAME the Express server is listening to            | string |
| SERVER_PORT      | The HTTP port the Express server is listening to           | string |
| LOG_LEVEL        | The level of the logger                                    | string |
| APPLICATION_NAME | The name of the application, used as prefix for the logger | string |

## Example
Start the server locally and then:

``` sh
curl "http://localhost:3000/oauth/authorize" \
-d client_id=foo \
-d response_type=id_token \
-d redirect_uri=https%3A%2F%2Fclient.example.org%2Fcb \
-d scope=openid \
-d state=af0ifjsldkj \
-d nonce=n-0S6_WzA2Mj \
-b X-Federation-Token=12345
```
