package httpapi

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/foxxpratiksau/roleproof/backend/internal/auth"
	"github.com/foxxpratiksau/roleproof/backend/internal/user"
	"golang.org/x/crypto/bcrypt"
)

type testUserStore struct {
	users map[string]user.User
}

func newTestUserStore(t *testing.T) *testUserStore {
	t.Helper()

	hash, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.MinCost)
	if err != nil {
		t.Fatalf("GenerateFromPassword() error = %v", err)
	}
	return &testUserStore{users: map[string]user.User{
		"test@example.com": {
			ID:           "00000000-0000-4000-8000-000000000001",
			Name:         "Test User",
			Email:        "test@example.com",
			PasswordHash: string(hash),
			Role:         "user",
			CreatedAt:    time.Now().UTC(),
			UpdatedAt:    time.Now().UTC(),
		},
	}}
}

func (s *testUserStore) Create(_ context.Context, value user.User) (user.User, error) {
	if _, exists := s.users[value.Email]; exists {
		return user.User{}, user.ErrEmailExists
	}
	s.users[value.Email] = value
	return value, nil
}

func (s *testUserStore) FindByID(_ context.Context, userID string) (user.User, error) {
	for _, value := range s.users {
		if value.ID == userID {
			return value, nil
		}
	}
	return user.User{}, user.ErrNotFound
}

func (s *testUserStore) FindByEmail(_ context.Context, email string) (user.User, error) {
	value, exists := s.users[email]
	if !exists {
		return user.User{}, user.ErrNotFound
	}
	return value, nil
}

type testPinger struct {
	err error
}

func (p testPinger) Ping(context.Context) error {
	return p.err
}

func newTestAPI(t *testing.T, pinger testPinger) (*API, *auth.TokenManager) {
	t.Helper()

	tokens := auth.NewTokenManager("test-secret-with-at-least-32-bytes", time.Minute)
	service := auth.NewService(newTestUserStore(t), tokens, bcrypt.MinCost)
	logger := slog.New(slog.DiscardHandler)
	return New(Dependencies{
		Auth:          service,
		Tokens:        tokens,
		Database:      pinger,
		Logger:        logger,
		AllowedOrigin: "http://localhost:3000",
	}), tokens
}

func TestAPIRegister(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		body       string
		wantStatus int
		wantError  string
		wantFields map[string]string
	}{
		{
			name:       "valid registration",
			body:       `{"name":"New User","email":"new@example.com","password":"password123"}`,
			wantStatus: http.StatusCreated,
		},
		{
			name:       "missing fields",
			body:       `{}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "validation failed",
			wantFields: map[string]string{
				"name":     "is required",
				"email":    "is required",
				"password": "is required",
			},
		},
		{
			name:       "duplicate email",
			body:       `{"name":"Another","email":"test@example.com","password":"password123"}`,
			wantStatus: http.StatusConflict,
			wantError:  "email already registered",
		},
		{
			name:       "unknown json field",
			body:       `{"name":"New User","email":"new@example.com","password":"password123","admin":true}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "invalid request",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			api, _ := newTestAPI(t, testPinger{})
			response := performRequest(api, http.MethodPost, "/auth/register", test.body)
			assertJSONResponse(t, response, test.wantStatus)

			var body struct {
				Error  string            `json:"error"`
				Fields map[string]string `json:"fields"`
				User   userResponse      `json:"user"`
			}
			decodeResponse(t, response, &body)
			if body.Error != test.wantError {
				t.Errorf("error = %q, want %q", body.Error, test.wantError)
			}
			if test.wantFields != nil && !mapsEqual(body.Fields, test.wantFields) {
				t.Errorf("fields = %#v, want %#v", body.Fields, test.wantFields)
			}
			if test.wantStatus == http.StatusCreated && body.User.Email != "new@example.com" {
				t.Errorf("user email = %q", body.User.Email)
			}
		})
	}
}

func TestAPILogin(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		body       string
		wantStatus int
	}{
		{
			name:       "valid credentials",
			body:       `{"email":"test@example.com","password":"password123"}`,
			wantStatus: http.StatusOK,
		},
		{
			name:       "invalid password",
			body:       `{"email":"test@example.com","password":"not-the-password"}`,
			wantStatus: http.StatusUnauthorized,
		},
		{
			name:       "unknown user",
			body:       `{"email":"missing@example.com","password":"password123"}`,
			wantStatus: http.StatusUnauthorized,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			api, tokens := newTestAPI(t, testPinger{})
			response := performRequest(api, http.MethodPost, "/auth/login", test.body)
			assertJSONResponse(t, response, test.wantStatus)

			var body loginResponse
			decodeResponse(t, response, &body)
			if test.wantStatus != http.StatusOK {
				return
			}
			if body.TokenType != "Bearer" || body.ExpiresIn != 60 || body.AccessToken == "" {
				t.Fatalf("login response = %+v", body)
			}
			if _, err := tokens.Verify(body.AccessToken); err != nil {
				t.Fatalf("Verify() error = %v", err)
			}
		})
	}
}

func TestAPICurrentUser(t *testing.T) {
	t.Parallel()

	api, tokens := newTestAPI(t, testPinger{})
	token, _, err := tokens.Issue("00000000-0000-4000-8000-000000000001", "user")
	if err != nil {
		t.Fatalf("Issue() error = %v", err)
	}

	tests := []struct {
		name       string
		token      string
		wantStatus int
		wantEmail  string
	}{
		{
			name:       "valid session",
			token:      token,
			wantStatus: http.StatusOK,
			wantEmail:  "test@example.com",
		},
		{
			name:       "missing token",
			wantStatus: http.StatusUnauthorized,
		},
		{
			name:       "invalid token",
			token:      "not-a-token",
			wantStatus: http.StatusUnauthorized,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			request := httptest.NewRequestWithContext(t.Context(), http.MethodGet, "/auth/me", nil)
			if test.token != "" {
				request.Header.Set("Authorization", "Bearer "+test.token)
			}
			response := httptest.NewRecorder()
			api.ServeHTTP(response, request)
			assertJSONResponse(t, response, test.wantStatus)

			if test.wantEmail == "" {
				return
			}
			var body registerResponse
			decodeResponse(t, response, &body)
			if body.User.Email != test.wantEmail {
				t.Fatalf("user email = %q, want %q", body.User.Email, test.wantEmail)
			}
		})
	}
}

func TestAPIGeneralContract(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		method     string
		path       string
		pinger     testPinger
		wantStatus int
		wantError  string
	}{
		{
			name:       "healthy",
			method:     http.MethodGet,
			path:       "/health",
			wantStatus: http.StatusOK,
		},
		{
			name:       "database unhealthy",
			method:     http.MethodGet,
			path:       "/health",
			pinger:     testPinger{err: errors.New("database unavailable")},
			wantStatus: http.StatusInternalServerError,
			wantError:  "internal server error",
		},
		{
			name:       "not found",
			method:     http.MethodGet,
			path:       "/missing",
			wantStatus: http.StatusNotFound,
			wantError:  "not found",
		},
		{
			name:       "method not allowed",
			method:     http.MethodGet,
			path:       "/auth/login",
			wantStatus: http.StatusMethodNotAllowed,
			wantError:  "method not allowed",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			api, _ := newTestAPI(t, test.pinger)
			response := performRequest(api, test.method, test.path, "")
			assertJSONResponse(t, response, test.wantStatus)

			var body errorResponse
			decodeResponse(t, response, &body)
			if body.Error != test.wantError {
				t.Errorf("error = %q, want %q", body.Error, test.wantError)
			}
		})
	}
}

func TestAPIAuthorizationStatusCodes(t *testing.T) {
	t.Parallel()

	api, tokens := newTestAPI(t, testPinger{})
	protected := api.requireRole("admin", http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	}))

	unauthenticated := httptest.NewRecorder()
	protected.ServeHTTP(
		unauthenticated,
		httptest.NewRequestWithContext(t.Context(), http.MethodGet, "/protected", nil),
	)
	assertJSONResponse(t, unauthenticated, http.StatusUnauthorized)

	token, _, err := tokens.Issue("user-id", "user")
	if err != nil {
		t.Fatalf("Issue() error = %v", err)
	}
	request := httptest.NewRequestWithContext(t.Context(), http.MethodGet, "/protected", nil)
	request.Header.Set("Authorization", "Bearer "+token)
	forbidden := httptest.NewRecorder()
	protected.ServeHTTP(forbidden, request)
	assertJSONResponse(t, forbidden, http.StatusForbidden)
}

func performRequest(handler http.Handler, method string, path string, body string) *httptest.ResponseRecorder {
	request := httptest.NewRequestWithContext(
		context.Background(),
		method,
		path,
		strings.NewReader(body),
	)
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	return response
}

func assertJSONResponse(t *testing.T, response *httptest.ResponseRecorder, expectedStatus int) {
	t.Helper()
	if response.Code != expectedStatus {
		t.Fatalf("status = %d, want %d; body = %s", response.Code, expectedStatus, response.Body)
	}
	if contentType := response.Header().Get("Content-Type"); contentType != "application/json" {
		t.Fatalf("Content-Type = %q, want application/json", contentType)
	}
}

func decodeResponse(t *testing.T, response *httptest.ResponseRecorder, destination any) {
	t.Helper()
	decoder := json.NewDecoder(bytes.NewReader(response.Body.Bytes()))
	if err := decoder.Decode(destination); err != nil {
		t.Fatalf("Decode() error = %v; body = %s", err, response.Body)
	}
}

func mapsEqual(left map[string]string, right map[string]string) bool {
	if len(left) != len(right) {
		return false
	}
	for key, value := range left {
		if right[key] != value {
			return false
		}
	}
	return true
}
