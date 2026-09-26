import supabase from './supabase';
import { Song, Playlist, Artist, Album, Genre, SubscriptionPlan, AdminStats, User } from '../types';

/**
 * Normalizes a raw Supabase song record into a PlayX Song model.
 */
export const formatSong = (s: any, isFav = false): Song => {
  if (!s) return null as any;
  const artistName = s.artists?.name || s.artist_name || 'Unknown Artist';
  const albumTitle = s.albums?.title || s.album_title || undefined;
  const albumCover = s.albums?.cover_art || s.cover_art || undefined;
  const genreName = s.genres?.name || s.genre_name || undefined;

  return {
    id: s.id,
    title: s.title || 'Untitled Track',
    artist_id: s.artist_id,
    artist_name: artistName,
    album_id: s.album_id || undefined,
    album_title: albumTitle,
    album_cover: albumCover,
    genre_id: s.genre_id || undefined,
    genre_name: genreName,
    audio_url: s.audio_url,
    file_path: s.audio_url,
    duration: typeof s.duration === 'number' ? s.duration : 180,
    cover_art: s.cover_art || albumCover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    plays_count: typeof s.plays_count === 'number' ? s.plays_count : 0,
    release_date: s.release_date || undefined,
    is_favorite: typeof isFav === 'boolean' ? isFav : !!s.is_favorite,
    added_at: s.added_at || s.created_at || undefined,
    lyrics: s.lyrics || undefined
  };
};

/**
 * Normalizes a raw Supabase playlist record into a PlayX Playlist model.
 */
export const formatPlaylist = (p: any, songs: Song[] = []): Playlist => {
  if (!p) return null as any;
  const songCount = Array.isArray(p.playlist_songs)
    ? p.playlist_songs.length
    : (typeof p.song_count === 'number' ? p.song_count : songs.length);

  return {
    id: p.id,
    user_id: p.user_id,
    userId: p.user_id,
    name: p.name || 'Untitled Playlist',
    description: p.description || '',
    cover_art: p.cover_art || (songs[0]?.cover_art) || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
    coverArt: p.cover_art || (songs[0]?.cover_art) || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
    is_public: p.is_public !== false,
    isPublic: p.is_public !== false,
    songs,
    song_count: songCount,
    songs_count: songCount,
    created_at: p.created_at || undefined
  };
};

// ==========================================
// 1. AUTHENTICATION & USERS
// ==========================================

export const authService = {
  async signUp(name: string, email: string, password: string, role = 'user') {
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name?.trim() || cleanEmail.split('@')[0] || 'PlayX Listener';

    // 1. Supabase Auth signup
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { name: cleanName, role }
      }
    });

    if (authError) {
      console.error('Supabase Auth signUp error:', authError);
      throw new Error(authError.message);
    }

    const authUser = authData.user;
    if (!authUser) {
      throw new Error('User creation failed in Supabase Auth');
    }

    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`;

    // 2. Persist application user record to public.users table
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: authUser.id,
        name: cleanName,
        email: cleanEmail,
        role,
        avatar: avatarUrl
      }, { onConflict: 'id' });

    if (userError) {
      console.warn('public.users upsert warning (trigger may have created):', userError.message);
    }

    // 3. Persist default free subscription
    const subId = `usub_${Math.random().toString(36).substring(2, 10)}`;
    await supabase
      .from('user_subscriptions')
      .upsert({
        id: subId,
        user_id: authUser.id,
        subscription_id: 'sub_free',
        status: 'active'
      }, { onConflict: 'user_id' });

    // 4. If artist role, auto-provision artist profile
    if (role === 'artist') {
      const artId = `art_${Math.random().toString(36).substring(2, 10)}`;
      await supabase
        .from('artists')
        .upsert({
          id: artId,
          user_id: authUser.id,
          name: cleanName,
          bio: `Official artist profile for ${cleanName}`,
          image: avatarUrl,
          is_verified: true,
          monthly_listeners: 0
        }, { onConflict: 'id' });
    }

    // 5. If session is available, return session token; otherwise log in immediately
    let token = authData.session?.access_token;
    if (!token) {
      const { data: loginData } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });
      token = loginData?.session?.access_token || '';
    }

    const playxUser = await authService.getUserProfile(authUser.id, cleanEmail, cleanName, role, avatarUrl);
    return { token, user: playxUser };
  },

  async signIn(email: string, password: string) {
    const cleanEmail = email.toLowerCase().trim();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });

    if (error) {
      console.error('Supabase Auth signIn error:', error);
      throw new Error(error.message);
    }

    const authUser = data.user;
    if (!authUser) {
      throw new Error('No user returned from Supabase Auth');
    }

    const token = data.session?.access_token || '';
    const playxUser = await authService.getUserProfile(
      authUser.id,
      cleanEmail,
      authUser.user_metadata?.name || cleanEmail.split('@')[0],
      authUser.user_metadata?.role || 'user'
    );

    return { token, user: playxUser };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Supabase Auth signOut error:', error);
    }
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }
    return data.session;
  },

  onAuthStateChange(callback: (session: any, user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          const profile = await authService.getUserProfile(session.user.id, session.user.email || '');
          callback(session, profile);
        } catch {
          callback(session, null);
        }
      } else {
        callback(null, null);
      }
    });
  },

  async getUserProfile(userId: string, email = '', fallbackName = '', fallbackRole = 'user', fallbackAvatar = ''): Promise<User> {
    // 1. Fetch user profile from public.users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    let userRecord = userData;

    // If missing from public.users, create it on demand
    if (!userRecord) {
      const name = fallbackName || email.split('@')[0] || 'PlayX Listener';
      const avatar = fallbackAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
      const { data: insertedUser } = await supabase
        .from('users')
        .upsert({
          id: userId,
          name,
          email,
          role: fallbackRole,
          avatar
        })
        .select()
        .single();
      userRecord = insertedUser;
    }

    // 2. Fetch subscription plan name
    let subscriptionName = 'Free';
    const { data: subData } = await supabase
      .from('user_subscriptions')
      .select('subscription_id, subscriptions(name)')
      .eq('user_id', userId)
      .maybeSingle();

    if (subData?.subscriptions) {
      subscriptionName = (subData.subscriptions as any).name || 'Free';
    } else if (subData?.subscription_id === 'sub_premium') {
      subscriptionName = 'Premium';
    }

    // 3. Fetch user counts
    const [{ count: favCount }, { count: plCount }] = await Promise.all([
      supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('playlists').select('id', { count: 'exact', head: true }).eq('user_id', userId)
    ]);

    return {
      id: userId,
      name: userRecord?.name || fallbackName || email.split('@')[0] || 'PlayX User',
      email: userRecord?.email || email,
      role: (userRecord?.role as any) || 'user',
      avatar: userRecord?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userId)}`,
      subscription: subscriptionName,
      created_at: userRecord?.created_at || undefined,
      stats: {
        favoritesCount: favCount || 0,
        playlistsCount: plCount || 0
      }
    };
  },

  async updateProfile(userId: string, data: { name?: string; avatar?: string; bio?: string }) {
    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name.trim();
    if (data.avatar !== undefined) updates.avatar = data.avatar;

    const { data: updated, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile in Supabase:', error);
      throw new Error(error.message);
    }

    return updated;
  }
};

// ==========================================
// 2. SONGS SERVICE
// ==========================================

export const songsService = {
  async getFavoriteIds(userId?: string): Promise<Set<string>> {
    if (!userId) return new Set();
    const { data, error } = await supabase
      .from('favorites')
      .select('song_id')
      .eq('user_id', userId);
    if (error || !data) return new Set();
    return new Set(data.map(f => f.song_id));
  },

  async getSongs(userId?: string, limit = 100): Promise<Song[]> {
    const [songsRes, favIds] = await Promise.all([
      supabase
        .from('songs')
        .select('*, artists(name), albums(title, cover_art), genres(name)')
        .limit(limit),
      songsService.getFavoriteIds(userId)
    ]);

    if (songsRes.error) {
      console.error('Error fetching songs from Supabase:', songsRes.error);
      throw new Error(songsRes.error.message);
    }

    return (songsRes.data || []).map(s => formatSong(s, favIds.has(s.id)));
  },

  async getPopularSongs(userId?: string, limit = 20): Promise<Song[]> {
    const [songsRes, favIds] = await Promise.all([
      supabase
        .from('songs')
        .select('*, artists(name), albums(title, cover_art), genres(name)')
        .order('plays_count', { ascending: false })
        .limit(limit),
      songsService.getFavoriteIds(userId)
    ]);

    if (songsRes.error) {
      console.error('Error fetching popular songs from Supabase:', songsRes.error);
      return [];
    }

    return (songsRes.data || []).map(s => formatSong(s, favIds.has(s.id)));
  },

  async getRecommendedSongs(userId?: string, limit = 20): Promise<Song[]> {
    const songs = await songsService.getSongs(userId, 50);
    // Shuffle slightly for varied recommendations
    return [...songs].sort(() => Math.random() - 0.5).slice(0, limit);
  },

  async getNewReleases(userId?: string, limit = 20): Promise<Song[]> {
    const [songsRes, favIds] = await Promise.all([
      supabase
        .from('songs')
        .select('*, artists(name), albums(title, cover_art), genres(name)')
        .order('release_date', { ascending: false })
        .limit(limit),
      songsService.getFavoriteIds(userId)
    ]);

    if (songsRes.error) {
      console.error('Error fetching new releases from Supabase:', songsRes.error);
      return [];
    }

    return (songsRes.data || []).map(s => formatSong(s, favIds.has(s.id)));
  },

  async getSongById(id: string, userId?: string): Promise<Song | null> {
    const [songRes, isFav] = await Promise.all([
      supabase
        .from('songs')
        .select('*, artists(name), albums(title, cover_art), genres(name)')
        .eq('id', id)
        .maybeSingle(),
      userId ? favoritesService.checkIsFavorite(userId, id) : false
    ]);

    if (songRes.error || !songRes.data) {
      return null;
    }

    return formatSong(songRes.data, isFav);
  },

  async playSong(songId: string, userId?: string): Promise<void> {
    // 1. Record listening history if user is authenticated
    if (userId) {
      await supabase
        .from('listening_history')
        .insert({
          id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          user_id: userId,
          song_id: songId,
          played_at: new Date().toISOString()
        });
    }

    // 2. Fetch current plays_count and increment
    const { data: song } = await supabase
      .from('songs')
      .select('plays_count')
      .eq('id', songId)
      .maybeSingle();

    if (song) {
      const newCount = (song.plays_count || 0) + 1;
      await supabase
        .from('songs')
        .update({ plays_count: newCount })
        .eq('id', songId);
    }
  },

  async uploadSong(songData: {
    title: string;
    artist_id: string;
    album_id?: string;
    genre_id?: string;
    audio_url: string;
    duration?: number;
    cover_art?: string;
    lyrics?: string;
  }): Promise<Song> {
    const songId = `sng_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const { data, error } = await supabase
      .from('songs')
      .insert({
        id: songId,
        title: songData.title.trim(),
        artist_id: songData.artist_id,
        album_id: songData.album_id || null,
        genre_id: songData.genre_id || null,
        audio_url: songData.audio_url,
        duration: songData.duration || 180,
        cover_art: songData.cover_art || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
        plays_count: 0,
        release_date: new Date().toISOString().split('T')[0]
      })
      .select('*, artists(name), albums(title, cover_art), genres(name)')
      .single();

    if (error) {
      console.error('Error inserting song to Supabase:', error);
      throw new Error(error.message);
    }

    return formatSong(data);
  },

  async deleteSong(id: string): Promise<void> {
    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting song from Supabase:', error);
      throw new Error(error.message);
    }
  }
};

// ==========================================
// 3. PLAYLISTS SERVICE
// ==========================================

export const playlistsService = {
  async getPlaylists(userId?: string): Promise<Playlist[]> {
    let query = supabase
      .from('playlists')
      .select('*, playlist_songs(id, song_id, songs(*, artists(name), albums(title, cover_art)))')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.or(`is_public.eq.true,user_id.eq.${userId}`);
    } else {
      query = query.eq('is_public', true);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching playlists from Supabase:', error);
      return [];
    }

    return (data || []).map(p => {
      const songs = (p.playlist_songs || [])
        .map((ps: any) => ps.songs ? formatSong(ps.songs) : null)
        .filter(Boolean) as Song[];
      return formatPlaylist(p, songs);
    });
  },

  async getPlaylistById(id: string, userId?: string): Promise<Playlist | null> {
    const [plRes, favIds] = await Promise.all([
      supabase
        .from('playlists')
        .select('*, playlist_songs(id, position, song_id, added_at, songs(*, artists(name), albums(title, cover_art), genres(name)))')
        .eq('id', id)
        .maybeSingle(),
      songsService.getFavoriteIds(userId)
    ]);

    if (plRes.error || !plRes.data) {
      return null;
    }

    const rawPl = plRes.data;
    // Sort songs by position
    const sortedPlaylistSongs = (rawPl.playlist_songs || []).sort(
      (a: any, b: any) => (a.position || 0) - (b.position || 0)
    );

    const songs: Song[] = sortedPlaylistSongs
      .map((ps: any) => {
        if (!ps.songs) return null;
        const formatted = formatSong(ps.songs, favIds.has(ps.songs.id));
        formatted.added_at = ps.added_at;
        return formatted;
      })
      .filter(Boolean) as Song[];

    return formatPlaylist(rawPl, songs);
  },

  async createPlaylist(data: {
    name: string;
    description?: string;
    cover_art?: string;
    is_public?: boolean;
    user_id: string;
  }): Promise<Playlist> {
    const id = `pl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const { data: created, error } = await supabase
      .from('playlists')
      .insert({
        id,
        name: data.name.trim(),
        description: data.description || '',
        cover_art: data.cover_art || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
        is_public: data.is_public !== false,
        user_id: data.user_id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating playlist in Supabase:', error);
      throw new Error(error.message);
    }

    return formatPlaylist(created, []);
  },

  async updatePlaylist(id: string, data: {
    name?: string;
    description?: string;
    cover_art?: string;
    is_public?: boolean;
  }): Promise<Playlist> {
    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name.trim();
    if (data.description !== undefined) updates.description = data.description;
    if (data.cover_art !== undefined) updates.cover_art = data.cover_art;
    if (data.is_public !== undefined) updates.is_public = data.is_public;

    const { data: updated, error } = await supabase
      .from('playlists')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating playlist in Supabase:', error);
      throw new Error(error.message);
    }

    return formatPlaylist(updated);
  },

  async deletePlaylist(id: string): Promise<void> {
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting playlist from Supabase:', error);
      throw new Error(error.message);
    }
  },

  async addSongToPlaylist(playlistId: string, songId: string): Promise<void> {
    // Check max position
    const { data: existing } = await supabase
      .from('playlist_songs')
      .select('position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = (existing?.[0]?.position || 0) + 1;
    const psId = `ps_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const { error } = await supabase
      .from('playlist_songs')
      .upsert({
        id: psId,
        playlist_id: playlistId,
        song_id: songId,
        position: nextPosition
      }, { onConflict: 'playlist_id,song_id' });

    if (error) {
      console.error('Error adding song to playlist in Supabase:', error);
      throw new Error(error.message);
    }
  },

  async removeSongFromPlaylist(playlistId: string, songId: string): Promise<void> {
    const { error } = await supabase
      .from('playlist_songs')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('song_id', songId);

    if (error) {
      console.error('Error removing song from playlist in Supabase:', error);
      throw new Error(error.message);
    }
  }
};

// ==========================================
// 4. FAVORITES SERVICE
// ==========================================

export const favoritesService = {
  async getFavorites(userId: string): Promise<Song[]> {
    if (!userId) return [];
    const { data, error } = await supabase
      .from('favorites')
      .select('song_id, created_at, songs(*, artists(name), albums(title, cover_art), genres(name))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching favorites from Supabase:', error);
      return [];
    }

    return (data || [])
      .map((f: any) => f.songs ? formatSong(f.songs, true) : null)
      .filter(Boolean) as Song[];
  },

  async addFavorite(userId: string, songId: string): Promise<void> {
    if (!userId || !songId) return;
    const favId = `fav_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const { error } = await supabase
      .from('favorites')
      .upsert({
        id: favId,
        user_id: userId,
        song_id: songId
      }, { onConflict: 'user_id,song_id' });

    if (error) {
      console.error('Error favoriting song in Supabase:', error);
      throw new Error(error.message);
    }
  },

  async removeFavorite(userId: string, songId: string): Promise<void> {
    if (!userId || !songId) return;
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('song_id', songId);

    if (error) {
      console.error('Error removing favorite from Supabase:', error);
      throw new Error(error.message);
    }
  },

  async checkIsFavorite(userId: string, songId: string): Promise<boolean> {
    if (!userId || !songId) return false;
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('song_id', songId)
      .maybeSingle();

    return !!data;
  }
};

// ==========================================
// 5. LISTENING HISTORY SERVICE
// ==========================================

export const historyService = {
  async getHistory(userId: string, limit = 50): Promise<Song[]> {
    if (!userId) return [];
    const [histRes, favIds] = await Promise.all([
      supabase
        .from('listening_history')
        .select('song_id, played_at, songs(*, artists(name), albums(title, cover_art), genres(name))')
        .eq('user_id', userId)
        .order('played_at', { ascending: false })
        .limit(limit),
      songsService.getFavoriteIds(userId)
    ]);

    if (histRes.error) {
      console.error('Error fetching listening history from Supabase:', histRes.error);
      return [];
    }

    // Deduplicate songs by song_id while keeping the most recent played_at
    const seen = new Set<string>();
    const songs: Song[] = [];

    for (const h of (histRes.data || [])) {
      if (h.songs && !seen.has(h.song_id)) {
        seen.add(h.song_id);
        const s = formatSong(h.songs, favIds.has(h.song_id));
        s.added_at = h.played_at || undefined;
        songs.push(s);
      }
    }

    return songs;
  }
};

// ==========================================
// 6. ARTISTS SERVICE
// ==========================================

export const artistsService = {
  async getArtists(): Promise<Artist[]> {
    const { data, error } = await supabase
      .from('artists')
      .select('*, songs(id), albums(id)')
      .order('monthly_listeners', { ascending: false });

    if (error) {
      console.error('Error fetching artists from Supabase:', error);
      return [];
    }

    return (data || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      bio: a.bio || '',
      image: a.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      is_verified: a.is_verified !== false,
      monthly_listeners: a.monthly_listeners || 0,
      user_id: a.user_id || undefined,
      songs: a.songs || [],
      albums: a.albums || []
    }));
  },

  async getArtistById(id: string, userId?: string): Promise<Artist | null> {
    const [artistRes, songsRes, albumsRes, favIds] = await Promise.all([
      supabase.from('artists').select('*').eq('id', id).maybeSingle(),
      supabase.from('songs').select('*, artists(name), albums(title, cover_art)').eq('artist_id', id),
      supabase.from('albums').select('*').eq('artist_id', id),
      songsService.getFavoriteIds(userId)
    ]);

    if (artistRes.error || !artistRes.data) {
      return null;
    }

    const a = artistRes.data;
    const songs = (songsRes.data || []).map(s => formatSong(s, favIds.has(s.id)));
    const albums = (albumsRes.data || []).map((alb: any) => ({
      id: alb.id,
      artist_id: alb.artist_id,
      artist_name: a.name,
      title: alb.title,
      cover_art: alb.cover_art,
      release_year: alb.release_year,
      genre: alb.genre
    }));

    return {
      id: a.id,
      name: a.name,
      bio: a.bio || '',
      image: a.image || undefined,
      is_verified: a.is_verified !== false,
      monthly_listeners: a.monthly_listeners || 0,
      user_id: a.user_id || undefined,
      songs,
      albums
    };
  },

  async updateArtist(id: string, data: { name?: string; bio?: string; image?: string }): Promise<void> {
    const { error } = await supabase
      .from('artists')
      .update(data)
      .eq('id', id);

    if (error) {
      console.error('Error updating artist in Supabase:', error);
      throw new Error(error.message);
    }
  },

  async getArtistDashboard(userId: string) {
    const { data: artist } = await supabase
      .from('artists')
      .select('*, albums(*), songs(*)')
      .eq('user_id', userId)
      .maybeSingle();

    if (!artist) {
      return {
        artist: null,
        stats: { totalPlays: 0, totalSongs: 0, totalAlbums: 0, monthlyListeners: 0 },
        songs: []
      };
    }

    const totalPlays = (artist.songs || []).reduce((acc: number, s: any) => acc + (s.plays_count || 0), 0);
    return {
      artist: {
        id: artist.id,
        name: artist.name,
        bio: artist.bio,
        image: artist.image,
        monthly_listeners: artist.monthly_listeners || 0
      },
      stats: {
        totalPlays,
        totalSongs: (artist.songs || []).length,
        totalAlbums: (artist.albums || []).length,
        monthlyListeners: artist.monthly_listeners || 0
      },
      songs: (artist.songs || []).map((s: any) => formatSong(s))
    };
  }
};

// ==========================================
// 7. ALBUMS SERVICE
// ==========================================

export const albumsService = {
  async getAlbums(): Promise<Album[]> {
    const { data, error } = await supabase
      .from('albums')
      .select('*, artists(name)')
      .order('release_year', { ascending: false });

    if (error) {
      console.error('Error fetching albums from Supabase:', error);
      return [];
    }

    return (data || []).map((a: any) => ({
      id: a.id,
      artist_id: a.artist_id,
      artist_name: a.artists?.name || 'Unknown Artist',
      title: a.title,
      cover_art: a.cover_art,
      release_year: a.release_year,
      genre: a.genre
    }));
  },

  async getAlbumById(id: string, userId?: string): Promise<Album | null> {
    const [albumRes, songsRes, favIds] = await Promise.all([
      supabase.from('albums').select('*, artists(name)').eq('id', id).maybeSingle(),
      supabase.from('songs').select('*, artists(name), albums(title, cover_art)').eq('album_id', id),
      songsService.getFavoriteIds(userId)
    ]);

    if (albumRes.error || !albumRes.data) {
      return null;
    }

    const a = albumRes.data;
    const songs = (songsRes.data || []).map(s => formatSong(s, favIds.has(s.id)));

    return {
      id: a.id,
      artist_id: a.artist_id,
      artist_name: a.artists?.name || 'Unknown Artist',
      title: a.title,
      cover_art: a.cover_art || undefined,
      release_year: a.release_year || undefined,
      genre: a.genre || undefined,
      songs
    };
  }
};

// ==========================================
// 8. GENRES SERVICE
// ==========================================

export const genresService = {
  async getGenres(): Promise<Genre[]> {
    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching genres from Supabase:', error);
      return [];
    }

    return (data || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      cover_image: g.cover_image
    }));
  }
};

// ==========================================
// 9. SUBSCRIPTIONS SERVICE
// ==========================================

export const subscriptionsService = {
  async getPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, subscription_features(feature)')
      .order('price', { ascending: true });

    if (error) {
      console.error('Error fetching subscriptions from Supabase:', error);
      return [];
    }

    return (data || []).map((sub: any) => {
      const dbFeatures = (sub.subscription_features || []).map((sf: any) => sf.feature);
      const features = dbFeatures.length > 0 ? dbFeatures : (sub.features || []);

      return {
        id: sub.id,
        name: sub.name,
        price: sub.price,
        description: sub.description || '',
        features
      };
    });
  },

  async getUserSubscription(userId: string) {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*, subscriptions(*)')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  },

  async upgradeSubscription(userId: string, planId = 'sub_premium') {
    const subRecordId = `usub_${Math.random().toString(36).substring(2, 10)}`;
    const { data, error } = await supabase
      .from('user_subscriptions')
      .upsert({
        id: subRecordId,
        user_id: userId,
        subscription_id: planId,
        status: 'active',
        starts_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select('*, subscriptions(name)')
      .single();

    if (error) {
      console.error('Error upgrading subscription in Supabase:', error);
      throw new Error(error.message);
    }

    const planName = (data?.subscriptions as any)?.name || (planId === 'sub_premium' ? 'Premium' : 'Free');
    return { subscription: planName, details: data };
  }
};

// ==========================================
// 10. ADMIN SERVICE
// ==========================================

export const adminService = {
  async getStats(): Promise<AdminStats> {
    const [
      { count: usersCount },
      { count: artistsCount },
      { count: songsCount },
      { count: playlistsCount },
      songsData
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('artists').select('id', { count: 'exact', head: true }),
      supabase.from('songs').select('id', { count: 'exact', head: true }),
      supabase.from('playlists').select('id', { count: 'exact', head: true }),
      supabase.from('songs').select('plays_count')
    ]);

    const totalPlays = (songsData.data || []).reduce((acc: number, s: any) => acc + (s.plays_count || 0), 0);

    return {
      totalUsers: usersCount || 0,
      totalArtists: artistsCount || 0,
      totalSongs: songsCount || 0,
      totalPlaylists: playlistsCount || 0,
      totalPlays: totalPlays || 0
    };
  },

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*, user_subscriptions(subscription_id, subscriptions(name))')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin users from Supabase:', error);
      return [];
    }

    return (data || []).map((u: any) => {
      const subName = u.user_subscriptions?.[0]?.subscriptions?.name ||
        (u.user_subscriptions?.[0]?.subscription_id === 'sub_premium' ? 'Premium' : 'Free');
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar,
        subscription: subName,
        created_at: u.created_at
      };
    });
  },

  async updateUserRole(userId: string, role: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user role in Supabase:', error);
      throw new Error(error.message);
    }
  },

  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user from Supabase:', error);
      throw new Error(error.message);
    }
  }
};

// ==========================================
// 11. SEARCH SERVICE
// ==========================================

export const searchService = {
  async searchAll(query: string, userId?: string) {
    if (!query || !query.trim()) {
      return { songs: [], artists: [], albums: [], playlists: [] };
    }
    const q = query.trim();

    const [songsRes, artistsRes, albumsRes, playlistsRes, favIds] = await Promise.all([
      supabase
        .from('songs')
        .select('*, artists(name), albums(title, cover_art), genres(name)')
        .ilike('title', `%${q}%`)
        .limit(20),
      supabase
        .from('artists')
        .select('*')
        .ilike('name', `%${q}%`)
        .limit(10),
      supabase
        .from('albums')
        .select('*, artists(name)')
        .ilike('title', `%${q}%`)
        .limit(10),
      supabase
        .from('playlists')
        .select('*')
        .eq('is_public', true)
        .ilike('name', `%${q}%`)
        .limit(10),
      songsService.getFavoriteIds(userId)
    ]);

    return {
      songs: (songsRes.data || []).map(s => formatSong(s, favIds.has(s.id))),
      artists: (artistsRes.data || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        bio: a.bio,
        image: a.image,
        monthly_listeners: a.monthly_listeners || 0
      })),
      albums: (albumsRes.data || []).map((alb: any) => ({
        id: alb.id,
        artist_id: alb.artist_id,
        artist_name: alb.artists?.name || 'Unknown Artist',
        title: alb.title,
        cover_art: alb.cover_art,
        release_year: alb.release_year,
        genre: alb.genre
      })),
      playlists: (playlistsRes.data || []).map(p => formatPlaylist(p))
    };
  }
};
