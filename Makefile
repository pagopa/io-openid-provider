.PHONY: build.image start.dev

start.dev:
	docker-compose up

build.image:
	docker build --tag fim-oidc-provider .
