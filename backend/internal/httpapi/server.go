// Package httpapi exposes RoleProof's JSON HTTP API.
package httpapi

import (
	"context"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/foxxpratiksau/roleproof/backend/internal/auth"
	resumedomain "github.com/foxxpratiksau/roleproof/backend/internal/resume"
)

// Pinger verifies that a backing service is reachable.
type Pinger interface {
	Ping(ctx context.Context) error
}

// API routes HTTP requests to application services.
type API struct {
	auth          *auth.Service
	tokens        *auth.TokenManager
	resumes       *resumedomain.Service
	database      Pinger
	logger        *slog.Logger
	allowedOrigin string
	handler       http.Handler
}

// Dependencies contains the collaborators required by the API.
type Dependencies struct {
	Auth          *auth.Service
	Tokens        *auth.TokenManager
	Resumes       *resumedomain.Service
	Database      Pinger
	Logger        *slog.Logger
	AllowedOrigin string
}

// New creates the API and its middleware chain.
func New(deps Dependencies) *API {
	api := &API{
		auth:          deps.Auth,
		tokens:        deps.Tokens,
		resumes:       deps.Resumes,
		database:      deps.Database,
		logger:        deps.Logger,
		allowedOrigin: deps.AllowedOrigin,
	}
	api.handler = api.withMiddleware(http.HandlerFunc(api.route))
	return api
}

// ServeHTTP implements http.Handler.
func (a *API) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	a.handler.ServeHTTP(w, r)
}

func (a *API) route(w http.ResponseWriter, r *http.Request) {
	switch r.URL.Path {
	case "/health":
		if !requireMethod(w, r, http.MethodGet) {
			return
		}
		a.health(w, r)
	case "/auth/register":
		if !requireMethod(w, r, http.MethodPost) {
			return
		}
		a.register(w, r)
	case "/auth/login":
		if !requireMethod(w, r, http.MethodPost) {
			return
		}
		a.login(w, r)
	case "/auth/me":
		if !requireMethod(w, r, http.MethodGet) {
			return
		}
		a.requireAuth(a.currentUser).ServeHTTP(w, r)
	case "/master-resume":
		a.requireAuth(a.masterResume).ServeHTTP(w, r)
	case "/resume-templates":
		a.requireAuth(a.resumeTemplates).ServeHTTP(w, r)
	default:
		if strings.HasPrefix(r.URL.Path, "/resume-templates/") {
			a.requireAuth(a.resumeTemplate).ServeHTTP(w, r)
			return
		}
		writeError(w, http.StatusNotFound, "not found")
	}
}

func (a *API) health(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()
	if err := a.database.Ping(ctx); err != nil {
		a.internalError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (a *API) internalError(w http.ResponseWriter, r *http.Request, err error) {
	a.logger.ErrorContext(
		r.Context(),
		"http request failed",
		"method", r.Method,
		"path", r.URL.Path,
		"error", err,
	)
	writeError(w, http.StatusInternalServerError, "internal server error")
}

func requireMethod(w http.ResponseWriter, r *http.Request, method string) bool {
	if r.Method == method {
		return true
	}
	methodNotAllowed(w, method)
	return false
}

func methodNotAllowed(w http.ResponseWriter, methods ...string) {
	w.Header().Set("Allow", strings.Join(methods, ", "))
	writeError(w, http.StatusMethodNotAllowed, "method not allowed")
}
