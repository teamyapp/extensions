package main

import (
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/apps/", enableCORS(
		http.StripPrefix("/apps/github",
			http.FileServer(http.Dir("apps/github/dist"))).ServeHTTP))
	log.Printf("Serving %s on HTTP port: %d\n", "public", 8082)
	log.Fatal(http.ListenAndServe(":8082", nil))
}

func enableCORS(handlerFunc http.HandlerFunc) http.HandlerFunc {
	return func(writer http.ResponseWriter, request *http.Request) {
		writer.Header().Set("Access-Control-Allow-Origin", "*")
		writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, PUT, OPTIONS, DELETE")
		writer.Header().Set("Access-Control-Allow-Headers",
			"Accept, Content-Type, Content-Length, Accept-Encoding, Authorization")
		if request.Method == http.MethodOptions {
			return
		}

		handlerFunc(writer, request)
	}
}
