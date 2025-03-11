import { prisma } from '../db';
import type { Playlist, Video } from '@prisma/client';

export async function getPlaylistById(id: string) {
  return await prisma.playlist.findUnique({
    where: { id },
    include: { videos: true }
  });
}

export async function createPlaylist(data: {
  name: string;
  description?: string;
  userId: string;
}) {
  return await prisma.playlist.create({
    data: {
      name: data.name,
      description: data.description,
      user: { connect: { id: data.userId } }
    }
  });
}

export async function updatePlaylist(id: string, data: {
  name?: string;
  description?: string;
}) {
  return await prisma.playlist.update({
    where: { id },
    data
  });
}

export async function deletePlaylist(id: string) {
  return await prisma.playlist.delete({
    where: { id }
  });
}

export async function addVideoToPlaylist(playlistId: string, videoData: {
  title: string;
  videoId: string;
  url: string;
}) {
  return await prisma.video.create({
    data: {
      ...videoData,
      playlist: { connect: { id: playlistId } }
    }
  });
}

export async function updateVideoStatus(videoId: string, status: string) {
  return await prisma.video.update({
    where: { id: videoId },
    data: { status }
  });
}

export async function getVideosByStatus(status: string) {
  return await prisma.video.findMany({
    where: { status },
    include: { playlist: true }
  });
}
