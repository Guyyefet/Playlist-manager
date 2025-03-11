package youtube

import (
	"context"
	"strings"

	"playlist-manager/internal/models"

	"google.golang.org/api/youtube/v3"
)

type Video = models.Video

type PlaylistChecker struct {
	service *youtube.Service
}

func NewPlaylistChecker(service *youtube.Service) *PlaylistChecker {
	return &PlaylistChecker{service: service}
}

func (c *PlaylistChecker) GetMusicPlaylists(ctx context.Context) ([]Video, error) {
	playlists, err := c.getPlaylists(ctx)
	if err != nil {
		return nil, err
	}

	var musicVideos []Video

	for _, playlist := range playlists {
		// Check if playlist name starts with "music:" or "Music:"
		if !strings.HasPrefix(playlist.Snippet.Title, "music:") && !strings.HasPrefix(playlist.Snippet.Title, "Music:") {
			continue
		}

		videos, err := c.getPlaylistItems(ctx, playlist.Id)
		if err != nil {
			continue
		}

		for _, video := range videos {
			// Skip unavailable videos
			if isVideoUnavailable(video) {
				continue
			}

			musicVideos = append(musicVideos, Video{
				Title:   video.Snippet.Title,
				VideoID: video.ContentDetails.VideoId,
				URL:     "https://www.youtube.com/watch?v=" + video.ContentDetails.VideoId,
			})
		}
	}

	return musicVideos, nil
}

func (c *PlaylistChecker) CheckPlaylists(ctx context.Context) ([]Video, error) {
	playlists, err := c.getPlaylists(ctx)
	if err != nil {
		return nil, err
	}

	var unavailableVideos []Video

	for _, playlist := range playlists {
		videos, err := c.getPlaylistItems(ctx, playlist.Id)
		if err != nil {
			continue
		}

		for _, video := range videos {
			if isVideoUnavailable(video) {
				unavailableVideos = append(unavailableVideos, Video{
					Title:   video.Snippet.Title,
					VideoID: video.ContentDetails.VideoId,
					Status:  video.Status.PrivacyStatus,
				})
			}
		}
	}

	return unavailableVideos, nil
}

func (c *PlaylistChecker) getPlaylists(ctx context.Context) ([]*youtube.Playlist, error) {
	var playlists []*youtube.Playlist
	pageToken := ""

	for {
		call := c.service.Playlists.List([]string{"snippet", "contentDetails"}).
			Mine(true).
			MaxResults(50)

		if pageToken != "" {
			call = call.PageToken(pageToken)
		}

		response, err := call.Do()
		if err != nil {
			return nil, err
		}

		playlists = append(playlists, response.Items...)

		pageToken = response.NextPageToken
		if pageToken == "" {
			break
		}
	}

	return playlists, nil
}

func (c *PlaylistChecker) getPlaylistItems(ctx context.Context, playlistID string) ([]*youtube.PlaylistItem, error) {
	var playlistItems []*youtube.PlaylistItem
	pageToken := ""

	for {
		call := c.service.PlaylistItems.List([]string{"snippet", "contentDetails", "status"}).
			PlaylistId(playlistID).
			MaxResults(50)

		if pageToken != "" {
			call = call.PageToken(pageToken)
		}

		response, err := call.Do()
		if err != nil {
			return nil, err
		}

		playlistItems = append(playlistItems, response.Items...)

		pageToken = response.NextPageToken
		if pageToken == "" {
			break
		}
	}

	return playlistItems, nil
}

func isVideoUnavailable(video *youtube.PlaylistItem) bool {
	return video.ContentDetails.VideoPublishedAt == "" ||
		video.Status.PrivacyStatus == "private" ||
		video.Status.PrivacyStatus == "deleted"
}
