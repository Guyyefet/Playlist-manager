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
	authService, err := auth.NewAuthService("config/credentials.json")
	if err != nil {
		log.Fatalf("Failed to create auth service: %v", err)
	}

	// Initialize database
	db, err := db.NewDB("playlists.db")
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Create HTTP handlers
	http.HandleFunc("/api/playlists", func(w http.ResponseWriter, r *http.Request) {
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
