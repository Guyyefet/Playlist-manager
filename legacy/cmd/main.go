package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"playlist-manager/internal/auth"
	"playlist-manager/internal/db"
	"playlist-manager/internal/rate_limiter"
	"playlist-manager/internal/youtube"
)

func main() {
	ctx := context.Background()

	// Initialize rate limiter
	limiter := rate_limiter.NewRateLimiter(time.Minute)
	limiter.SetLimit("/api/auth/status", 5)
	limiter.SetLimit("/api/auth/url", 2)
	limiter.SetLimit("/login/callback", 3)

	// Rate limiting middleware
	rateLimitMiddleware := func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			if !limiter.Allow(r.URL.Path) {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusTooManyRequests)
				json.NewEncoder(w).Encode(map[string]string{
					"error":   "Too many requests",
					"message": "Please wait before making another request",
				})
				return
			}
			next(w, r)
		}
	}

	// Initialize auth service
	authService, err := auth.NewAuthService()
	if err != nil {
		log.Fatalf("Failed to create auth service: %v", err)
	}

	// Initialize database
	db, err := db.NewDB("playlists.db")
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Authentication middleware
	authMiddleware := func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			// Set CORS headers for all responses
			w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

			// Handle preflight requests
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			// Skip auth check for auth endpoints
			if r.URL.Path == "/api/auth/url" || r.URL.Path == "/login/callback" {
				next(w, r)
				return
			}

			// Validate token
			token, err := authService.TokenFromFile("config/token.json")
			if err != nil || token == nil || !authService.IsTokenValid(token) {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				json.NewEncoder(w).Encode(map[string]string{
					"error":    "Unauthorized",
					"loginUrl": "/login",
				})
				return
			}

			// Add token to context
			ctx := context.WithValue(r.Context(), "token", token)
			next(w, r.WithContext(ctx))
		}
	}

	// Create HTTP handlers
	http.HandleFunc("/api/playlists", authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		// Get YouTube service
		youtubeService, err := authService.CreateYouTubeService(ctx)
		if err != nil {
			http.Error(w, "Error creating YouTube client", http.StatusInternalServerError)
			return
		}

		checker := youtube.NewPlaylistChecker(youtubeService)

		playlists, err := checker.CheckPlaylists(ctx)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(playlists); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}))

	http.HandleFunc("/api/auth/status", rateLimitMiddleware(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		authService.HandleAuthStatus(w, r)
	}))

	http.HandleFunc("/api/auth/url", rateLimitMiddleware(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"url": authService.GetAuthURL(),
		})
	}))

	http.HandleFunc("/login/callback", rateLimitMiddleware(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		log.Printf("Received callback request: %s %s", r.Method, r.URL.String())

		var code string

		// Handle both GET and POST requests
		if r.Method == "GET" {
			// Get code from query parameter
			code = r.URL.Query().Get("code")
			log.Printf("GET request with code: %s", code)
			if code == "" {
				http.Error(w, "Missing code parameter", http.StatusBadRequest)
				return
			}
		} else if r.Method == "POST" {
			// Parse request body
			var request struct {
				Code string `json:"code"`
			}
			if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
				log.Printf("Error decoding request body: %v", err)
				http.Error(w, "Invalid request body", http.StatusBadRequest)
				return
			}
			code = request.Code
			log.Printf("POST request with code: %s", code)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Exchange code for token
		log.Printf("Exchanging code for token")
		token, err := authService.Config.Exchange(ctx, code)
		if err != nil {
			log.Printf("Error exchanging code for token: %v", err)
			http.Error(w, "Failed to exchange code for token: "+err.Error(), http.StatusInternalServerError)
			return
		}
		log.Printf("Successfully exchanged code for token")

		// Save token
		authService.SaveToken("config/token.json", token)

		// For GET requests, redirect to the home page
		if r.Method == "GET" {
			http.Redirect(w, r, "http://localhost:5173/home", http.StatusFound)
			return
		}

		// For POST requests, return JSON response
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"status": "success",
		})
	}))

	http.HandleFunc("/api/auth/revoke", rateLimitMiddleware(func(w http.ResponseWriter, r *http.Request) {
		token := authService.GetCachedToken()
		if token == nil {
			http.Error(w, "No active token to revoke", http.StatusBadRequest)
			return
		}

		authService.RevokeToken(token)
		w.WriteHeader(http.StatusOK)
	}))

	http.HandleFunc("/api/playlists/music", authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		// Get YouTube service
		youtubeService, err := authService.CreateYouTubeService(ctx)
		if err != nil {
			http.Error(w, "Error creating YouTube client", http.StatusInternalServerError)
			return
		}

		checker := youtube.NewPlaylistChecker(youtubeService)

		playlists, err := checker.GetMusicPlaylists(ctx)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(playlists); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}))

	// Start server
	log.Println("Starting server on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
