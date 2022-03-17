.PHONY: build.image start.dev

start.dev:
	echo "Starting docker images"
	docker-compose up -d db
	echo "Docker images started"

	echo "Run application"
	yarn run start

build.image:
	docker build --tag fim-oidc-provider .
