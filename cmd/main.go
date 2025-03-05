package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"playlist-manager/internal/auth"
	"playlist-manager/internal/db"
	"playlist-manager/internal/youtube"
)

func main() {
	ctx := context.Background()

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
			// Skip auth check for auth endpoints
			if r.URL.Path == "/api/auth/url" || r.URL.Path == "/api/auth/callback" {
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

	http.HandleFunc("/api/auth/url", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"url": authService.GetAuthURL(),
		})
	})

	http.HandleFunc("/api/auth/callback", func(w http.ResponseWriter, r *http.Request) {
		// Parse request body
		var request struct {
			Code string `json:"code"`
		}
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Exchange code for token
		token, err := authService.Config.Exchange(ctx, request.Code)
		if err != nil {
			http.Error(w, "Failed to exchange code for token", http.StatusInternalServerError)
			return
		}

		// Save token
		authService.SaveToken("config/token.json", token)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"status": "success",
		})
	})

	http.HandleFunc("/api/playlists/music", func(w http.ResponseWriter, r *http.Request) {
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
	})

	// Start server
	log.Println("Starting server on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
