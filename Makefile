.PHONY: build.image start.dev

start.dev:
	echo "Starting docker images"
	docker-compose up -d mongodb
	docker-compose up service
	echo "Docker images started"

start.local:
	echo "Starting docker database"
	docker-compose up -d mongodb
	echo "Docker images started"
	echo "Starting local application"
	yarn start

build.image:
	docker build --tag fim-oidc-provider .
