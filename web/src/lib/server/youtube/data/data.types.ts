import type { Prisma } from '$db/index';

export interface Playlist extends Prisma.PlaylistGetPayload<{}> {
  videos?: Video[];
}

export interface Video extends Prisma.VideoGetPayload<{}> {
  playlist?: Playlist;
}

export interface PlaylistWithVideos extends Playlist {
  videos: Video[];
}