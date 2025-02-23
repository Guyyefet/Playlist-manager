package models

import (
	"time"
)

type Playlist struct {
	ID        uint   `gorm:"primaryKey"`
	Name      string `gorm:"uniqueIndex"`
	Videos    []Video
	CreatedAt time.Time
	UpdatedAt time.Time
}

type Video struct {
	ID         uint `gorm:"primaryKey"`
	PlaylistID uint `gorm:"index"`
	Title      string
	VideoID    string `gorm:"uniqueIndex"`
	URL        string
	Status     string
	CreatedAt  time.Time
	UpdatedAt  time.Time
}
