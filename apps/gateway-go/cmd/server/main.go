package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/saidevanirudh/portfolio-ai/apps/gateway-go/internal/session"
	"github.com/saidevanirudh/portfolio-ai/apps/gateway-go/internal/webrtc"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})
	mux.HandleFunc("/session/start", session.Start)
	mux.HandleFunc("/session/end", session.End)
	mux.HandleFunc("/session/list", session.List)
	mux.HandleFunc("/webrtc/offer", webrtc.Offer)
	mux.HandleFunc("/webrtc/answer", webrtc.Answer)
	mux.HandleFunc("/webrtc/ice", webrtc.ICE)
	mux.HandleFunc("/orchestrate", orchestrate)

	addr := ":8080"
	log.Printf("gateway listening on %s", addr)
	if err := http.ListenAndServe(addr, chain(mux, traceMiddleware, corsMiddleware, authMiddleware, rateLimitMiddleware)); err != nil {
		log.Fatal(err)
	}
}

type middleware func(http.Handler) http.Handler

func chain(h http.Handler, mws ...middleware) http.Handler {
	for i := len(mws) - 1; i >= 0; i-- {
		h = mws[i](h)
	}
	return h
}

func traceMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		traceID := r.Header.Get("X-Trace-Id")
		if traceID == "" {
			traceID = time.Now().UTC().Format("20060102T150405.000000000")
		}
		w.Header().Set("X-Trace-Id", traceID)
		log.Printf("trace=%s method=%s path=%s", traceID, r.Method, r.URL.Path)
		next.ServeHTTP(w, r)
	})
}

func authMiddleware(next http.Handler) http.Handler {
	expected := os.Getenv("KURAMA_API_TOKEN")
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/healthz" {
			next.ServeHTTP(w, r)
			return
		}
		if expected == "" {
			next.ServeHTTP(w, r)
			return
		}
		if r.Header.Get("Authorization") != "Bearer "+expected {
			w.WriteHeader(http.StatusUnauthorized)
			_, _ = w.Write([]byte("unauthorized"))
			return
		}
		next.ServeHTTP(w, r)
	})
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Trace-Id")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

var (
	rateMu   sync.Mutex
	requests = map[string][]time.Time{}
)

func rateLimitMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		host, _, err := net.SplitHostPort(r.RemoteAddr)
		if err != nil {
			host = r.RemoteAddr
		}
		now := time.Now()
		window := now.Add(-1 * time.Minute)

		rateMu.Lock()
		hits := requests[host][:0]
		for _, t := range requests[host] {
			if t.After(window) {
				hits = append(hits, t)
			}
		}
		if len(hits) > 120 {
			rateMu.Unlock()
			w.WriteHeader(http.StatusTooManyRequests)
			_, _ = w.Write([]byte("rate limit exceeded"))
			return
		}
		requests[host] = append(hits, now)
		rateMu.Unlock()

		next.ServeHTTP(w, r)
	})
}

func orchestrate(w http.ResponseWriter, r *http.Request) {
	type payload struct {
		Text string `json:"text"`
	}
	var req payload
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "invalid payload"})
		return
	}

	if req.Text == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "text is required"})
		return
	}

	orchestratorURL := os.Getenv("ORCHESTRATOR_URL")
	if orchestratorURL == "" {
		orchestratorURL = "http://localhost:8000"
	}

	body, _ := json.Marshal(map[string]string{"text": req.Text})
	resp, err := http.Post(orchestratorURL+"/orchestrate", "application/json", bytes.NewBuffer(body))
	if err != nil {
		w.WriteHeader(http.StatusBadGateway)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "orchestrator unavailable"})
		return
	}
	defer resp.Body.Close()

	raw, readErr := io.ReadAll(resp.Body)
	if readErr != nil {
		w.WriteHeader(http.StatusBadGateway)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "failed to read orchestrator response"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	_, _ = w.Write(raw)
}
