import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Database Operations', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a playlist', async () => {
    const playlist = await prisma.playlist.create({
      data: {
        name: 'Test Playlist',
        description: 'Test Description'
      }
    });

    expect(playlist).toHaveProperty('id');
    expect(playlist.name).toBe('Test Playlist');
    expect(playlist.description).toBe('Test Description');
  });

  it('should create a video and associate with playlist', async () => {
    const playlist = await prisma.playlist.create({
      data: {
        name: 'Test Playlist for Video',
        description: 'Test Description'
      }
    });

    const video = await prisma.video.create({
      data: {
        title: 'Test Video',
        videoId: 'test-video-id',
        url: 'https://example.com/video',
        playlistId: playlist.id
      }
    });

    expect(video).toHaveProperty('id');
    expect(video.playlistId).toBe(playlist.id);
    expect(video.title).toBe('Test Video');
  });
});
