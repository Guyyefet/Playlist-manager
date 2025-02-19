package main

type UnavailableVideo struct {
	PlaylistName string
	VideoTitle   string
	VideoID      string
	Status       string
}

type PlaylistVideo struct {
	PlaylistName string
	VideoTitle   string
	VideoID      string
	URL          string
}
