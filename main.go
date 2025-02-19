package main

import (
	"context"
	"log"
)

func main() {
	ctx := context.Background()

	// Initialize auth service
	authService, err := NewAuthService("credentials.json")
	if err != nil {
		log.Fatalf("Failed to create auth service: %v", err)
	}

	// Get YouTube service
	youtubeService, err := authService.CreateYouTubeService(ctx)
	if err != nil {
		log.Fatalf("Error creating YouTube client: %v", err)
	}

	// Initialize YouTube checker
	checker := NewPlaylistChecker(youtubeService)

	// Get unavailable videos
	unavailableVideos, err := checker.CheckPlaylists(ctx)
	if err != nil {
		log.Fatalf("Error checking playlists: %v", err)
	}

	// Get music playlist videos
	musicVideos, err := checker.GetMusicPlaylists(ctx)
	if err != nil {
		log.Fatalf("Error getting music playlists: %v", err)
	}

	// Export results
	exporter := NewCSVExporter()

	// Export unavailable videos
	if err := exporter.ExportUnavailable(unavailableVideos, "unavailable_videos.csv"); err != nil {
		log.Fatalf("Error exporting unavailable videos to CSV: %v", err)
	}

	// Export music playlist videos
	if err := exporter.ExportMusicPlaylists(musicVideos, "music_playlists.csv"); err != nil {
		log.Fatalf("Error exporting music playlists to CSV: %v", err)
	}

	log.Printf("Found %d unavailable videos. Results exported to unavailable_videos.csv\n", len(unavailableVideos))
	log.Printf("Found %d music videos. Results exported to music_playlists.csv\n", len(musicVideos))
}
