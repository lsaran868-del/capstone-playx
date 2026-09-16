import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Music, User, Disc, ListMusic } from 'lucide-react';
import api from '../services/api';
import { Song, Artist, Album, Genre, Playlist } from '../types';
import Card from '../components/Card';
import SongRow from '../components/SongRow';

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(urlQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'songs' | 'artists' | 'albums' | 'playlists'>('all');
  const [results, setResults] = useState<{
    songs: Song[];
    artists: Artist[];
    albums: Album[];
    playlists: Playlist[];
  }>({
    songs: [],
    artists: [],
    albums: [],
    playlists: []
  });
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await api.get('/genres');
        setGenres(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchGenres();
  }, []);

  // Synchronize query when URL query changes from Navbar
  useEffect(() => {
    if (urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, [urlQuery]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ songs: [], artists: [], albums: [], playlists: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setResults({
          songs: res.data.songs || [],
          artists: res.data.artists || [],
          albums: res.data.albums || [],
          playlists: res.data.playlists || []
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleInputChange = (val: string) => {
    setQuery(val);
    if (val.trim()) {
      setSearchParams({ q: val }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const totalResults =
    results.songs.length + results.artists.length + results.albums.length + results.playlists.length;

  return (
    <div className="p-8 space-y-8 pb-24 select-none max-w-7xl mx-auto">
      {/* Search Input Bar */}
      <div className="relative max-w-xl">
        <SearchIcon className="w-5 h-5 absolute left-4 top-3.5 text-muse-subtext" />
        <input
          type="text"
          placeholder="Search songs, artists, albums, or playlists..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          className="w-full bg-muse-card/60 border border-muse-border/50 text-white text-sm rounded-full py-3 pl-12 pr-6 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/30 transition-all shadow-xl backdrop-blur-md"
          autoFocus
        />
      </div>

      {/* Tabs when searching */}
      {query.trim() && (
        <div className="flex items-center gap-2 border-b border-muse-border/40 pb-4 overflow-x-auto">
          {(['all', 'songs', 'artists', 'albums', 'playlists'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-xs font-semibold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
                  : 'bg-muse-card/60 border border-muse-border/40 text-muse-subtext hover:text-white hover:bg-muse-hover'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-muse-subtext">Searching PlayX catalogue...</span>
        </div>
      )}

      {/* Search Results */}
      {!loading && query.trim() && totalResults > 0 && (
        <div className="space-y-10">
          {/* Songs section */}
          {(activeTab === 'all' || activeTab === 'songs') && results.songs.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Music className="w-5 h-5 text-pink-400" />
                <span>Songs</span>
                <span className="text-xs text-muse-subtext font-normal">({results.songs.length})</span>
              </h2>
              <div className="bg-muse-card/40 backdrop-blur-md rounded-2xl border border-muse-border/40 p-3 divide-y divide-muse-border/20">
                {results.songs.map((song, i) => (
                  <SongRow key={song.id} song={song} index={i} queue={results.songs} />
                ))}
              </div>
            </section>
          )}

          {/* Artists section */}
          {(activeTab === 'all' || activeTab === 'artists') && results.artists.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" />
                <span>Artists</span>
                <span className="text-xs text-muse-subtext font-normal">({results.artists.length})</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {results.artists.map((artist) => (
                  <Card
                    key={artist.id}
                    id={artist.id}
                    title={artist.name}
                    subtitle="Artist"
                    image={artist.image}
                    type="artist"
                    onClick={() => navigate(`/artist/${artist.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Albums section */}
          {(activeTab === 'all' || activeTab === 'albums') && results.albums.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Disc className="w-5 h-5 text-amber-400" />
                <span>Albums</span>
                <span className="text-xs text-muse-subtext font-normal">({results.albums.length})</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {results.albums.map((album) => (
                  <Card
                    key={album.id}
                    id={album.id}
                    title={album.title}
                    subtitle={album.artist_name || 'Album'}
                    image={album.cover_art}
                    type="album"
                    onClick={() => navigate(`/album/${album.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Playlists section */}
          {(activeTab === 'all' || activeTab === 'playlists') && results.playlists.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ListMusic className="w-5 h-5 text-pink-400" />
                <span>Playlists</span>
                <span className="text-xs text-muse-subtext font-normal">({results.playlists.length})</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {results.playlists.map((playlist) => (
                  <Card
                    key={playlist.id}
                    id={playlist.id}
                    title={playlist.name}
                    subtitle={`Playlist • ${playlist.user_name || 'User'}`}
                    image={playlist.cover_art || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80'}
                    type="playlist"
                    onClick={() => navigate(`/playlist/${playlist.id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* No results */}
      {!loading && query.trim() && totalResults === 0 && (
        <div className="py-20 text-center space-y-3">
          <p className="text-lg font-bold text-white">No results found for &ldquo;{query}&rdquo;</p>
          <p className="text-sm text-muse-subtext max-w-md mx-auto">
            Please make sure words are spelled correctly or try searching for a different song, artist, album, or playlist.
          </p>
        </div>
      )}

      {/* Default Browse Genres Grid when not searching */}
      {!query.trim() && (
        <section className="space-y-6">
          <h2 className="text-2xl font-extrabold text-white">Browse All Genres</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {genres.map((genre) => (
              <div
                key={genre.id}
                onClick={() => handleInputChange(genre.name)}
                className="h-36 rounded-2xl p-4 relative overflow-hidden cursor-pointer group shadow-xl border border-muse-border/30 bg-gradient-to-br from-muse-card to-muse-dark hover:scale-[1.03] transition-transform"
              >
                <span className="font-extrabold text-lg text-white block max-w-[80%] z-10 relative">
                  {genre.name}
                </span>
                <img
                  src={genre.cover_image || 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=300&q=80'}
                  alt={genre.name}
                  className="w-24 h-24 absolute -right-3 -bottom-3 rotate-12 rounded-lg object-cover shadow-2xl group-hover:rotate-0 transition-transform"
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default SearchPage;
