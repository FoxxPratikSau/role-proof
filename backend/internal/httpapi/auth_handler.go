package httpapi

import (
	"errors"
	"net/http"
	"net/mail"
	"strings"
	"unicode/utf8"

	"github.com/foxxpratiksau/roleproof/backend/internal/auth"
	"github.com/foxxpratiksau/roleproof/backend/internal/user"
)

type registerRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type userResponse struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

type registerResponse struct {
	User userResponse `json:"user"`
}

type loginResponse struct {
	AccessToken string       `json:"access_token"`
	TokenType   string       `json:"token_type"`
	ExpiresIn   int64        `json:"expires_in"`
	User        userResponse `json:"user"`
}

func (a *API) register(w http.ResponseWriter, r *http.Request) {
	var request registerRequest
	if err := decodeJSON(w, r, &request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request")
		return
	}

	if fields := validateRegister(request); len(fields) > 0 {
		writeValidationError(w, fields)
		return
	}

	created, err := a.auth.Register(
		r.Context(),
		request.Name,
		request.Email,
		request.Password,
	)
	if errors.Is(err, user.ErrEmailExists) {
		writeError(w, http.StatusConflict, "email already registered")
		return
	}
	if err != nil {
		a.internalError(w, r, err)
		return
	}

	writeJSON(w, http.StatusCreated, registerResponse{User: presentUser(created)})
}

func (a *API) login(w http.ResponseWriter, r *http.Request) {
	var request loginRequest
	if err := decodeJSON(w, r, &request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request")
		return
	}

	if fields := validateLogin(request); len(fields) > 0 {
		writeValidationError(w, fields)
		return
	}

	found, token, expiresIn, err := a.auth.Login(
		r.Context(),
		request.Email,
		request.Password,
	)
	if errors.Is(err, auth.ErrInvalidCredentials) {
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	if err != nil {
		a.internalError(w, r, err)
		return
	}

	writeJSON(w, http.StatusOK, loginResponse{
		AccessToken: token,
		TokenType:   "Bearer",
		ExpiresIn:   expiresIn,
		User:        presentUser(found),
	})
}

func (a *API) currentUser(w http.ResponseWriter, r *http.Request, principal auth.Principal) {
	found, err := a.auth.CurrentUser(r.Context(), principal.UserID)
	if errors.Is(err, user.ErrNotFound) {
		writeError(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	if err != nil {
		a.internalError(w, r, err)
		return
	}

	writeJSON(w, http.StatusOK, registerResponse{User: presentUser(found)})
}

func validateRegister(request registerRequest) map[string]string {
	fields := validateLogin(loginRequest{Email: request.Email, Password: request.Password})
	name := strings.TrimSpace(request.Name)
	switch {
	case name == "":
		fields["name"] = "is required"
	case utf8.RuneCountInString(name) > 120:
		fields["name"] = "must be at most 120 characters"
	}
	return fields
}

func validateLogin(request loginRequest) map[string]string {
	fields := map[string]string{}
	email := strings.ToLower(strings.TrimSpace(request.Email))
	switch {
	case email == "":
		fields["email"] = "is required"
	case len(email) > 320 || !isEmail(email):
		fields["email"] = "must be a valid email address"
	}

	switch {
	case request.Password == "":
		fields["password"] = "is required"
	case len(request.Password) < 8:
		fields["password"] = "must be at least 8 characters"
	case len(request.Password) > 72:
		fields["password"] = "must be at most 72 bytes"
	}
	return fields
}

func isEmail(value string) bool {
	address, err := mail.ParseAddress(value)
	return err == nil && address.Address == value
}

func presentUser(value user.User) userResponse {
	return userResponse{
		ID:    value.ID,
		Name:  value.Name,
		Email: value.Email,
		Role:  value.Role,
	}
}
