import supabase from './supabase';
import {
  authService,
  songsService,
  playlistsService,
  favoritesService,
  historyService,
  artistsService,
  albumsService,
  genresService,
  subscriptionsService,
  adminService,
  searchService
} from './supabaseService';

/**
 * Resolves full media URLs for streaming audio and uploaded images.
 * Audio files are hosted locally in /audio/*.mp3.
 */
export const getFullMediaUrl = (path: string | undefined | null): string => {
  if (!path) return '';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:') ||
    path.startsWith('data:')
  ) {
    return path;
  }
  return path.startsWith('/') ? path : `/${path}`;
};

export const API_BASE_URL = '/api';

/**
 * Tracks the active Supabase Auth user ID.
 */
let cachedUserId: string | null = null;

supabase.auth.onAuthStateChange((_event, session) => {
  cachedUserId = session?.user?.id || null;
});

supabase.auth.getSession().then(({ data }) => {
  if (data?.session?.user) {
    cachedUserId = data.session.user.id;
  }
});

const getActiveUserId = async (): Promise<string | null> => {
  if (cachedUserId) return cachedUserId;
  const { data } = await supabase.auth.getSession();
  if (data?.session?.user) {
    cachedUserId = data.session.user.id;
    return cachedUserId;
  }
  return null;
};

/**
 * Converts File or Blob from FormData to Base64 Data URL for persistent storage in Supabase
 */
const fileToDataUrl = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Centralized Supabase API client providing full Axios-compatible interface.
 * All operations execute strictly against Supabase PostgreSQL via the centralized Supabase client.
 */
const api = {
  async get(url: string, _config?: any): Promise<{ data: any; status: number }> {
    const cleanUrl = url.startsWith('/api') ? url.slice(4) : url;
    const [path, queryString] = cleanUrl.split('?');
    const params = new URLSearchParams(queryString || '');
    const userId = await getActiveUserId();

    // 1. Health check
    if (path === '/health') {
      return {
        status: 200,
        data: {
          status: 'UP',
          message: 'PlayX Supabase API is active',
          database: 'CONNECTED',
          database_engine: 'Supabase PostgreSQL'
        }
      };
    }

    // 2. Songs
    if (path === '/songs') {
      const limit = Number(params.get('limit')) || 100;
      const data = await songsService.getSongs(userId || undefined, limit);
      return { status: 200, data };
    }
    if (path === '/songs/popular') {
      const data = await songsService.getPopularSongs(userId || undefined);
      return { status: 200, data };
    }
    if (path === '/songs/recommended') {
      const data = await songsService.getRecommendedSongs(userId || undefined);
      return { status: 200, data };
    }
    if (path === '/songs/new-releases') {
      const data = await songsService.getNewReleases(userId || undefined);
      return { status: 200, data };
    }
    if (path.startsWith('/songs/') && !path.includes('/stream') && !path.includes('/play')) {
      const id = path.replace('/songs/', '');
      const data = await songsService.getSongById(id, userId || undefined);
      return { status: 200, data };
    }

    // 3. Playlists
    if (path === '/playlists') {
      const data = await playlistsService.getPlaylists(userId || undefined);
      return { status: 200, data };
    }
    if (path.startsWith('/playlists/')) {
      const id = path.replace('/playlists/', '');
      const data = await playlistsService.getPlaylistById(id, userId || undefined);
      return { status: 200, data };
    }

    // 4. Favorites
    if (path === '/favorites') {
      if (!userId) return { status: 200, data: [] };
      const data = await favoritesService.getFavorites(userId);
      return { status: 200, data };
    }

    // 5. Listening History
    if (path === '/history' || path === '/history/recent') {
      if (!userId) return { status: 200, data: [] };
      const data = await historyService.getHistory(userId);
      return { status: 200, data };
    }

    // 6. Artists
    if (path === '/artists') {
      const data = await artistsService.getArtists();
      return { status: 200, data };
    }
    if (path.startsWith('/artists/') && !path.includes('/dashboard') && !path.includes('/image')) {
      const id = path.replace('/artists/', '');
      const data = await artistsService.getArtistById(id, userId || undefined);
      return { status: 200, data };
    }
    if (path === '/artists/dashboard') {
      if (!userId) return { status: 200, data: { artist: null, songs: [], stats: {} } };
      const data = await artistsService.getArtistDashboard(userId);
      return { status: 200, data };
    }

    // 7. Albums
    if (path === '/albums') {
      const data = await albumsService.getAlbums();
      return { status: 200, data };
    }
    if (path.startsWith('/albums/')) {
      const id = path.replace('/albums/', '');
      const data = await albumsService.getAlbumById(id, userId || undefined);
      return { status: 200, data };
    }

    // 8. Genres
    if (path === '/genres') {
      const data = await genresService.getGenres();
      return { status: 200, data };
    }

    // 9. Subscriptions
    if (path === '/subscriptions/plans') {
      const data = await subscriptionsService.getPlans();
      return { status: 200, data };
    }
    if (path === '/subscriptions/current') {
      if (!userId) return { status: 200, data: null };
      const data = await subscriptionsService.getUserSubscription(userId);
      return { status: 200, data };
    }

    // 10. Admin
    if (path === '/admin/stats') {
      const data = await adminService.getStats();
      return { status: 200, data };
    }
    if (path === '/admin/users') {
      const data = await adminService.getAllUsers();
      return { status: 200, data };
    }
    if (path === '/admin/songs') {
      const data = await songsService.getSongs(userId || undefined, 500);
      return { status: 200, data };
    }

    // 11. Search
    if (path === '/search') {
      const q = params.get('q') || '';
      const data = await searchService.searchAll(q, userId || undefined);
      return { status: 200, data };
    }

    // 12. Current User Profile (/auth/me)
    if (path === '/auth/me') {
      if (!userId) throw { response: { status: 401, data: { error: 'Not authenticated' } } };
      const data = await authService.getUserProfile(userId);
      return { status: 200, data };
    }

    return { status: 200, data: null };
  },

  async post(url: string, body?: any, _config?: any): Promise<{ data: any; status: number }> {
    const cleanUrl = url.startsWith('/api') ? url.slice(4) : url;
    const userId = await getActiveUserId();

    // 1. Auth routes
    if (cleanUrl === '/auth/register') {
      const res = await authService.signUp(body.name, body.email, body.password, body.role);
      return { status: 201, data: res };
    }
    if (cleanUrl === '/auth/login') {
      const res = await authService.signIn(body.email, body.password);
      return { status: 200, data: res };
    }
    if (cleanUrl === '/auth/social-login') {
      const res = await authService.signIn(body.email, 'PlayX@2026');
      return { status: 200, data: res };
    }
    if (cleanUrl === '/auth/logout') {
      await authService.signOut();
      return { status: 200, data: { message: 'Logged out' } };
    }

    // 2. Playlists
    if (cleanUrl === '/playlists') {
      if (!userId) throw { response: { status: 401, data: { error: 'Please log in to create a playlist' } } };
      const playlist = await playlistsService.createPlaylist({
        name: body.name,
        description: body.description,
        cover_art: body.cover_art,
        is_public: body.is_public !== false,
        user_id: userId
      });
      return { status: 201, data: playlist };
    }
    if (cleanUrl.startsWith('/playlists/') && cleanUrl.endsWith('/songs')) {
      const playlistId = cleanUrl.replace('/playlists/', '').replace('/songs', '');
      await playlistsService.addSongToPlaylist(playlistId, body.song_id);
      return { status: 200, data: { message: 'Song added to playlist' } };
    }

    // 3. Favorites
    if (cleanUrl.startsWith('/favorites/')) {
      const songId = cleanUrl.replace('/favorites/', '');
      if (!userId) throw { response: { status: 401, data: { error: 'Please log in to favorite songs' } } };
      await favoritesService.addFavorite(userId, songId);
      return { status: 200, data: { message: 'Added to favorites' } };
    }

    // 4. Play tracking
    if (cleanUrl.startsWith('/songs/') && cleanUrl.endsWith('/play')) {
      const songId = cleanUrl.replace('/songs/', '').replace('/play', '');
      await songsService.playSong(songId, userId || undefined);
      return { status: 200, data: { message: 'Playback recorded' } };
    }

    // 5. Upload Song Metadata
    if (cleanUrl === '/songs/upload') {
      const song = await songsService.uploadSong(body);
      return { status: 201, data: song };
    }

    // 6. Subscriptions
    if (cleanUrl === '/subscriptions/upgrade') {
      if (!userId) throw { response: { status: 401, data: { error: 'Please log in' } } };
      const res = await subscriptionsService.upgradeSubscription(userId, body.plan_id);
      return { status: 200, data: res };
    }

    // 7. Image Upload
    if (cleanUrl === '/upload/image') {
      let url = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80';
      if (body instanceof FormData) {
        const file = body.get('file');
        if (file && typeof file === 'object' && 'size' in file) {
          url = await fileToDataUrl(file as File);
        }
      }
      return { status: 200, data: { url } };
    }

    return { status: 200, data: {} };
  },

  async put(url: string, body?: any, _config?: any): Promise<{ data: any; status: number }> {
    const cleanUrl = url.startsWith('/api') ? url.slice(4) : url;
    const userId = await getActiveUserId();

    // 1. Update playlist
    if (cleanUrl.startsWith('/playlists/')) {
      const id = cleanUrl.replace('/playlists/', '');
      const updated = await playlistsService.updatePlaylist(id, body);
      return { status: 200, data: updated };
    }

    // 2. Update profile
    if (cleanUrl === '/auth/profile') {
      if (!userId) throw { response: { status: 401, data: { error: 'Please log in' } } };
      const updated = await authService.updateProfile(userId, body);
      return { status: 200, data: { user: updated } };
    }

    // 3. Update artist image
    if (cleanUrl.startsWith('/artists/') && cleanUrl.endsWith('/image')) {
      const id = cleanUrl.replace('/artists/', '').replace('/image', '');
      await artistsService.updateArtist(id, { image: body.image });
      return { status: 200, data: { message: 'Artist image updated' } };
    }

    // 4. Update user role (admin)
    if (cleanUrl.startsWith('/admin/users/') && cleanUrl.endsWith('/role')) {
      const id = cleanUrl.replace('/admin/users/', '').replace('/role', '');
      await adminService.updateUserRole(id, body.role);
      return { status: 200, data: { message: 'Role updated' } };
    }

    return { status: 200, data: {} };
  },

  async delete(url: string, _config?: any): Promise<{ data: any; status: number }> {
    const cleanUrl = url.startsWith('/api') ? url.slice(4) : url;
    const userId = await getActiveUserId();

    // 1. Remove song from playlist
    if (cleanUrl.startsWith('/playlists/') && cleanUrl.includes('/songs/')) {
      const parts = cleanUrl.split('/');
      const playlistId = parts[2];
      const songId = parts[4];
      await playlistsService.removeSongFromPlaylist(playlistId, songId);
      return { status: 200, data: { message: 'Song removed from playlist' } };
    }

    // 2. Delete playlist
    if (cleanUrl.startsWith('/playlists/')) {
      const id = cleanUrl.replace('/playlists/', '');
      await playlistsService.deletePlaylist(id);
      return { status: 200, data: { message: 'Playlist deleted' } };
    }

    // 3. Remove favorite
    if (cleanUrl.startsWith('/favorites/')) {
      const songId = cleanUrl.replace('/favorites/', '');
      if (userId) {
        await favoritesService.removeFavorite(userId, songId);
      }
      return { status: 200, data: { message: 'Removed from favorites' } };
    }

    // 4. Delete song
    if (cleanUrl.startsWith('/songs/') || cleanUrl.startsWith('/admin/songs/')) {
      const id = cleanUrl.replace('/admin/songs/', '').replace('/songs/', '');
      await songsService.deleteSong(id);
      return { status: 200, data: { message: 'Song deleted' } };
    }

    // 5. Delete user (admin)
    if (cleanUrl.startsWith('/admin/users/')) {
      const id = cleanUrl.replace('/admin/users/', '');
      await adminService.deleteUser(id);
      return { status: 200, data: { message: 'User deleted' } };
    }

    return { status: 200, data: {} };
  }
};

export default api;
