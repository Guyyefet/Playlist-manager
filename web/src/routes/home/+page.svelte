<script lang="ts">
  import PlaylistList from '$lib/PlaylistList.svelte';
  import type { Playlist } from '$lib/types';
  import { onMount } from 'svelte';
  export let data;
  
  let playlists: Playlist[] = [];
  let isLoading = false;

  onMount(() => {
    if (!data.user) {
      window.location.href = '/login';
    }
  });

  async function loadPlaylists() {
    isLoading = true;
    try {
      console.log('Starting playlist fetch...');
      const response = await fetch('/api/playlists');
      console.log('Received response:', response);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch playlists: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Playlist data:', data);
      playlists = data as Playlist[];
    } catch (error) {
      console.error('Failed to load playlists:', error);
      alert('Failed to load playlists. Please check console for details.');
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
        on:click={loadPlaylists} 
        disabled={isLoading}>
        Load Playlists
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
</style>
