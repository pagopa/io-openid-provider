.PHONY: build.image start.dev

start.dev:
	echo "Starting docker images"
	docker-compose up -d postgres
	docker-compose up service
	echo "Docker images started"

build.image:
	docker build --tag fim-oidc-provider .
