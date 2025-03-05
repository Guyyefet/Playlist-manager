<script lang="ts">
  import PlaylistList from '$lib/PlaylistList.svelte';
  import type { Playlist } from '$lib/types';
  import { onMount } from 'svelte';
  
  let playlists: Playlist[] = [];
  let isLoading = false;
  let activePlaylistView: 'all' | 'music' = 'music';

  onMount(async () => {
    try {
      // Check authentication status
      const authCheck = await fetch('/api/playlists');
      if (authCheck.status === 401) {
        window.location.href = '/login';
        return;
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      window.location.href = '/login';
    }
  });

  async function loadPlaylists(view: 'all' | 'music') {
    isLoading = true;
    try {
      const endpoint = view === 'music' 
        ? '/api/playlists/music' 
        : '/api/playlists';
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch playlists');
      playlists = await response.json() as Playlist[];
      activePlaylistView = view;
    } catch (error) {
      console.error('Failed to load playlists:', error);
      alert('Failed to load playlists. Please try again.');
    } finally {
      isLoading = false;
    }
  }
</script>

<main class="container">
  <h1>Playlist Manager</h1>

  <div class="controls">
    <div class="playlist-view-buttons">
      <button 
        class:active={activePlaylistView === 'music'}
        on:click={() => loadPlaylists('music')} 
        disabled={isLoading}>
        Music Playlists
      </button>
      <button 
        class:active={activePlaylistView === 'all'}
        on:click={() => loadPlaylists('all')} 
        disabled={isLoading}>
        All Playlists
      </button>
    </div>
  </div>

  {#if isLoading}
    <div class="loading">Loading playlists...</div>
  {:else}
    <PlaylistList {playlists} />
  {/if}
</main>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .controls {
    margin-bottom: 2rem;
  }

  .view-buttons {
    margin-bottom: 1rem;
    display: flex;
    gap: 0.5rem;
  }

  .playlist-view-buttons {
    margin-top: 1rem;
    display: flex;
    gap: 0.5rem;
  }

  button {
    padding: 0.5rem 1rem;
    background: #eee;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  button:hover {
    background: #ddd;
  }
  
  button.active {
    background: #007bff;
    color: white;
    border-color: #0069d9;
  }
  
  button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .loading {
    margin: 1rem 0;
    color: #666;
  }

  .results-container {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    margin-top: 2rem;
  }

  .result {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .result.video img {
    width: 120px;
    height: 90px;
    border-radius: 4px;
    object-fit: cover;
  }

  .result.playlist .icon {
    font-size: 2rem;
    width: 120px;
    height: 90px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f0f0f0;
    border-radius: 4px;
  }

  .details {
    flex: 1;
  }

  .details h4 {
    margin: 0 0 0.5rem;
    font-size: 1.1rem;
  }

  .details p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
  }
</style>
