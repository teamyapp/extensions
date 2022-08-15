package main

import (
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/", enableCORS(http.FileServer(http.Dir("dev")).ServeHTTP))
	http.HandleFunc("/app/", enableCORS(
		http.StripPrefix("/app",
			http.FileServer(http.Dir("dist"))).ServeHTTP))
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
