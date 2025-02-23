package main

import (
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type DB struct {
	db *gorm.DB
}

func NewDB(dbPath string) (*DB, error) {
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// Auto migrate the schema
	err = db.AutoMigrate(&Playlist{}, &Video{})
	if err != nil {
		return nil, err
	}

	return &DB{db: db}, nil
}

func (d *DB) SaveMusicVideos(videos []Video) error {
	return d.db.Transaction(func(tx *gorm.DB) error {
		for _, video := range videos {
			result := tx.Model(&Video{}).
				Where("video_id = ?", video.VideoID).
				Updates(video)

			if result.RowsAffected == 0 {
				if err := tx.Create(&video).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}

func (d *DB) SaveUnavailableVideos(videos []Video) error {
	return d.db.Transaction(func(tx *gorm.DB) error {
		for _, video := range videos {
			result := tx.Model(&Video{}).
				Where("video_id = ?", video.VideoID).
				Updates(video)

			if result.RowsAffected == 0 {
				if err := tx.Create(&video).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}

func (d *DB) Close() error {
	sqlDB, err := d.db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}
