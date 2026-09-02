.PHONY: build fmt migrate-down migrate-up seed test test-race vet

build:
	go build ./cmd/api

fmt:
	gofmt -s -w .

migrate-down:
	go run ./cmd/migrate -direction down -steps 1

migrate-up:
	go run ./cmd/migrate -direction up

seed:
	psql "$$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/seed.sql

test:
	go test ./...

test-race:
	go test -race ./...

vet:
	go vet ./...
