package main

import (
	"encoding/csv"
	"os"
)

type CSVExporter struct{}

func NewCSVExporter() *CSVExporter {
	return &CSVExporter{}
}

func (e *CSVExporter) ExportUnavailable(videos []UnavailableVideo, filename string) error {
	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	if err := writer.Write([]string{"Playlist Name", "Video Title", "Video ID", "Status"}); err != nil {
		return err
	}

	for _, video := range videos {
		if err := writer.Write([]string{
			video.PlaylistName,
			video.VideoTitle,
			video.VideoID,
			video.Status,
		}); err != nil {
			return err
		}
	}

	return nil
}

func (e *CSVExporter) ExportMusicPlaylists(videos []PlaylistVideo, filename string) error {
	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	if err := writer.Write([]string{"Playlist Name", "Video Title", "Video ID", "URL"}); err != nil {
		return err
	}

	for _, video := range videos {
		if err := writer.Write([]string{
			video.PlaylistName,
			video.VideoTitle,
			video.VideoID,
			video.URL,
		}); err != nil {
			return err
		}
	}

	return nil
}
