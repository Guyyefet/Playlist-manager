package main

import (
	"context"
	"log"

	"google.golang.org/api/youtube/v3"
)

func main() {
	ctx := context.Background()

	// Initialize auth service
	authService, err := NewAuthService("credentials.json")
	if err != nil {
		log.Fatalf("Failed to create auth service: %v", err)
	}

	// Get YouTube service
	var youtubeService *youtube.Service
	youtubeService, err = authService.CreateYouTubeService(ctx)
	if err != nil {
		log.Fatalf("Error creating YouTube client: %v", err)
	}

	// Initialize YouTube checker
	checker := NewPlaylistChecker(youtubeService)

	// Get unavailable videos
	log.Println("Checking playlists... calling API")
	unavailableVideos, err := checker.CheckPlaylists(ctx)
	if err != nil {
		log.Fatalf("Error checking playlists: %v", err)
	}

	// Get music playlist videos
	log.Println("Checking playlists... calling API")
	musicVideos, err := checker.GetMusicPlaylists(ctx)
	if err != nil {
		log.Fatalf("Error getting music playlists: %v", err)
	}

	// Initialize database
	db, err := NewDB("playlists.db")
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Save unavailable videos
	if err := db.SaveUnavailableVideos(unavailableVideos); err != nil {
		log.Fatalf("Error saving unavailable videos: %v", err)
	}

	// Save music playlist videos
	if err := db.SaveMusicVideos(musicVideos); err != nil {
		log.Fatalf("Error saving music playlist videos: %v", err)
	}

	log.Printf("Found %d unavailable videos. Results saved to database\n", len(unavailableVideos))
	log.Printf("Found %d music videos. Results saved to database\n", len(musicVideos))
}
