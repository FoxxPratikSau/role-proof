FROM golang:1.26.6-alpine AS build

WORKDIR /src
COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/roleproof-api ./cmd/api

FROM alpine:3.23

RUN apk add --no-cache ca-certificates \
    && addgroup -S roleproof \
    && adduser -S -G roleproof roleproof

COPY --from=build /out/roleproof-api /usr/local/bin/roleproof-api

USER roleproof
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/roleproof-api"]
