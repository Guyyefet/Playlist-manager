<script lang="ts">
  import type { Playlist } from './types';
  
  export let playlists: Playlist[];
</script>

<div class="playlist-grid">
  {#each playlists as playlist}
    <div class="playlist-card">
      <h3>{playlist.name}</h3>
      <p>{playlist.videos.length} videos</p>
    </div>
  {/each}
</div>

<style>
  .playlist-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
  
  .playlist-card {
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.2s;
  }
  
  .playlist-card:hover {
    transform: translateY(-2px);
  }
</style>
