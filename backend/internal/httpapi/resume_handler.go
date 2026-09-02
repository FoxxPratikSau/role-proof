package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/foxxpratiksau/roleproof/backend/internal/auth"
	resumedomain "github.com/foxxpratiksau/roleproof/backend/internal/resume"
)

type saveMasterResumeRequest struct {
	Title              string          `json:"title"`
	Content            json.RawMessage `json:"content"`
	SelectedTemplateID *string         `json:"selected_template_id"`
	ExpectedVersion    int             `json:"expected_version"`
}

type createTemplateRequest struct {
	Name           string          `json:"name"`
	Description    string          `json:"description"`
	SourceFilename *string         `json:"source_filename"`
	Specification  json.RawMessage `json:"specification"`
}

type templateListResponse struct {
	Templates []resumedomain.Template `json:"templates"`
}

func (a *API) masterResume(w http.ResponseWriter, r *http.Request, principal auth.Principal) {
	switch r.Method {
	case http.MethodGet:
		master, err := a.resumes.Master(r.Context(), principal.UserID)
		if errors.Is(err, resumedomain.ErrNotFound) || errors.Is(err, resumedomain.ErrTemplateNotFound) {
			writeError(w, http.StatusNotFound, "master resume not found")
			return
		}
		if err != nil {
			a.internalError(w, r, err)
			return
		}
		writeJSON(w, http.StatusOK, master)
	case http.MethodPut:
		var request saveMasterResumeRequest
		if err := decodeJSON(w, r, &request); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		master, err := a.resumes.SaveMaster(
			r.Context(), principal.UserID, request.Title, request.Content,
			request.SelectedTemplateID, int32(request.ExpectedVersion),
		)
		switch {
		case errors.Is(err, resumedomain.ErrConflict):
			writeError(w, http.StatusConflict, "master resume changed in another session")
		case errors.Is(err, resumedomain.ErrTemplateNotFound), errors.Is(err, resumedomain.ErrInvalid):
			writeError(w, http.StatusBadRequest, err.Error())
		case err != nil:
			a.internalError(w, r, err)
		default:
			writeJSON(w, http.StatusOK, master)
		}
	case http.MethodDelete:
		err := a.resumes.DeleteMaster(r.Context(), principal.UserID)
		if errors.Is(err, resumedomain.ErrNotFound) || errors.Is(err, resumedomain.ErrTemplateNotFound) {
			writeError(w, http.StatusNotFound, "master resume not found")
			return
		}
		if err != nil {
			a.internalError(w, r, err)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	default:
		methodNotAllowed(w, http.MethodGet, http.MethodPut, http.MethodDelete)
	}
}

func (a *API) resumeTemplates(w http.ResponseWriter, r *http.Request, principal auth.Principal) {
	switch r.Method {
	case http.MethodGet:
		templates, err := a.resumes.Templates(r.Context(), principal.UserID)
		if err != nil {
			a.internalError(w, r, err)
			return
		}
		writeJSON(w, http.StatusOK, templateListResponse{Templates: templates})
	case http.MethodPost:
		var request createTemplateRequest
		if err := decodeJSON(w, r, &request); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		sourceFilename := ""
		if request.SourceFilename != nil {
			sourceFilename = *request.SourceFilename
		}
		template, err := a.resumes.CreateTemplate(
			r.Context(), principal.UserID, request.Name, request.Description,
			sourceFilename, request.Specification,
		)
		switch {
		case errors.Is(err, resumedomain.ErrTemplateNameTaken):
			writeError(w, http.StatusConflict, "a template with this name already exists")
		case errors.Is(err, resumedomain.ErrInvalid):
			writeError(w, http.StatusBadRequest, err.Error())
		case err != nil:
			a.internalError(w, r, err)
		default:
			writeJSON(w, http.StatusCreated, template)
		}
	default:
		methodNotAllowed(w, http.MethodGet, http.MethodPost)
	}
}

func (a *API) resumeTemplate(w http.ResponseWriter, r *http.Request, principal auth.Principal) {
	id := strings.TrimPrefix(r.URL.Path, "/resume-templates/")
	if !isUUID(id) {
		writeError(w, http.StatusNotFound, "resume template not found")
		return
	}

	switch r.Method {
	case http.MethodGet:
		template, err := a.resumes.Template(r.Context(), principal.UserID, id)
		if errors.Is(err, resumedomain.ErrTemplateNotFound) {
			writeError(w, http.StatusNotFound, "resume template not found")
			return
		}
		if err != nil {
			a.internalError(w, r, err)
			return
		}
		writeJSON(w, http.StatusOK, template)
	case http.MethodDelete:
		err := a.resumes.DeleteTemplate(r.Context(), principal.UserID, id)
		if errors.Is(err, resumedomain.ErrTemplateNotFound) {
			writeError(w, http.StatusNotFound, "resume template not found")
			return
		}
		if err != nil {
			a.internalError(w, r, err)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	default:
		methodNotAllowed(w, http.MethodGet, http.MethodDelete)
	}
}

func isUUID(value string) bool {
	if len(value) != 36 {
		return false
	}
	for index, char := range value {
		if index == 8 || index == 13 || index == 18 || index == 23 {
			if char != '-' {
				return false
			}
			continue
		}
		if !((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f') || (char >= 'A' && char <= 'F')) {
			return false
		}
	}
	return true
}
