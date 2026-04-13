package webrtc

import (
	"encoding/json"
	"net/http"
)

type OfferRequest struct {
	SDP string `json:"sdp"`
}

type OfferResponse struct {
	Type string `json:"type"`
	SDP  string `json:"sdp"`
}

type IceRequest struct {
	Candidate string `json:"candidate"`
}

func Offer(w http.ResponseWriter, r *http.Request) {
	var req OfferRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid offer payload"})
		return
	}
	if req.SDP == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "sdp is required"})
		return
	}

	writeJSON(w, http.StatusOK, OfferResponse{
		Type: "answer",
		SDP:  "v=0\no=- 0 0 IN IP4 127.0.0.1\ns=kurama\n",
	})
}

func Answer(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "answer-received"})
}

func ICE(w http.ResponseWriter, r *http.Request) {
	var req IceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid ice payload"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "candidate-accepted"})
}

func writeJSON(w http.ResponseWriter, code int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(payload)
}
