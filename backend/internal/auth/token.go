package auth

import (
	"errors"
	"fmt"
	"time"

	"github.com/foxxpratiksau/roleproof/backend/internal/id"
	"github.com/golang-jwt/jwt/v5"
)

const signingAlgorithm = "HS256"

var ErrInvalidToken = errors.New("auth: invalid token")

// Principal is the authenticated identity carried by an access token.
type Principal struct {
	UserID string
	Role   string
}

type accessClaims struct {
	Role string `json:"role"`
	jwt.RegisteredClaims
}

// TokenManager signs and verifies short-lived JWT access tokens.
type TokenManager struct {
	secret []byte
	ttl    time.Duration
	issuer string
}

// NewTokenManager creates an HS256 token manager.
func NewTokenManager(secret string, ttl time.Duration) *TokenManager {
	return &TokenManager{
		secret: []byte(secret),
		ttl:    ttl,
		issuer: "roleproof-api",
	}
}

// Issue creates an access token for a user and reports its lifetime in seconds.
func (m *TokenManager) Issue(userID string, role string) (string, int64, error) {
	now := time.Now().UTC()
	tokenID, err := id.New()
	if err != nil {
		return "", 0, fmt.Errorf("auth: creating token id: %w", err)
	}

	claims := accessClaims{
		Role: role,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    m.issuer,
			Subject:   userID,
			ID:        tokenID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(m.ttl)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(m.secret)
	if err != nil {
		return "", 0, fmt.Errorf("auth: signing access token: %w", err)
	}
	return signed, int64(m.ttl.Seconds()), nil
}

// Verify authenticates an access token and returns its principal.
func (m *TokenManager) Verify(raw string) (Principal, error) {
	claims := &accessClaims{}
	token, err := jwt.ParseWithClaims(
		raw,
		claims,
		func(token *jwt.Token) (any, error) {
			if token.Method.Alg() != signingAlgorithm {
				return nil, ErrInvalidToken
			}
			return m.secret, nil
		},
		jwt.WithExpirationRequired(),
		jwt.WithIssuer(m.issuer),
		jwt.WithValidMethods([]string{signingAlgorithm}),
	)
	if err != nil || !token.Valid || claims.Subject == "" || claims.Role == "" {
		return Principal{}, ErrInvalidToken
	}

	return Principal{UserID: claims.Subject, Role: claims.Role}, nil
}
