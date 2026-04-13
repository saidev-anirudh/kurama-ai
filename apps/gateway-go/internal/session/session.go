package session

import (
	"encoding/json"
	"math/rand/v2"
	"net/http"
	"sync"
	"time"

	"github.com/saidevanirudh/portfolio-ai/apps/gateway-go/internal/provider"
)

type SessionResponse struct {
	SessionID string `json:"session_id"`
	Status    string `json:"status"`
	Provider  string `json:"provider"`
}

type Session struct {
	ID        string
	CreatedAt time.Time
	Provider  provider.Adapter
}

var (
	mu       sync.Mutex
	sessions = map[string]Session{}
)

func Start(w http.ResponseWriter, r *http.Request) {
	runtime := r.URL.Query().Get("runtime")
	adapter, err := provider.NewAdapter(runtime)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	id := randomID()
	mu.Lock()
	sessions[id] = Session{
		ID:        id,
		CreatedAt: time.Now().UTC(),
		Provider:  adapter,
	}
	mu.Unlock()

	writeJSON(w, http.StatusOK, SessionResponse{SessionID: id, Status: "started", Provider: provider.Summary(adapter)})
}

func End(w http.ResponseWriter, r *http.Request) {
	sessionID := r.URL.Query().Get("session_id")
	if sessionID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "session_id is required"})
		return
	}

	mu.Lock()
	session, ok := sessions[sessionID]
	if ok {
		delete(sessions, sessionID)
	}
	mu.Unlock()

	if !ok {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "session not found"})
		return
	}
	writeJSON(w, http.StatusOK, SessionResponse{SessionID: session.ID, Status: "ended", Provider: provider.Summary(session.Provider)})
}

func List(w http.ResponseWriter, _ *http.Request) {
	mu.Lock()
	defer mu.Unlock()

	payload := make([]SessionResponse, 0, len(sessions))
	for _, sess := range sessions {
		payload = append(payload, SessionResponse{
			SessionID: sess.ID,
			Status:    "active",
			Provider:  provider.Summary(sess.Provider),
		})
	}
	writeJSON(w, http.StatusOK, payload)
}

func randomID() string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
	out := make([]byte, 12)
	for i := range out {
		out[i] = chars[rand.IntN(len(chars))]
	}
	return string(out)
}

func writeJSON(w http.ResponseWriter, code int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(payload)
}
