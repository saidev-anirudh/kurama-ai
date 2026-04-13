package main

import (
	"log"
	"net/http"

	apihttp "github.com/saidevanirudh/portfolio-ai/apps/api-go/internal/http"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", apihttp.Healthz)

	addr := ":8081"
	log.Printf("api listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}
