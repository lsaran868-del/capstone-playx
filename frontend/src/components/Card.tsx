import React from 'react';
import { Play } from 'lucide-react';

interface CardProps {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  type?: 'song' | 'artist' | 'album' | 'playlist';
  badge?: React.ReactNode;
  onClick?: () => void;
  onPlay?: () => void;
}

const Card: React.FC<CardProps> = ({ title, subtitle, image, type = 'song', badge, onClick, onPlay }) => {
  const isArtist = type === 'artist';

  return (
    <div
      onClick={onClick}
      className="glass-panel p-4 rounded-2xl hover:bg-muse-hover/70 transition-all duration-300 group cursor-pointer relative flex flex-col border border-muse-border/30 hover:border-pink-500/50 shadow-xl"
    >
      <div className="relative mb-3.5 w-full aspect-square overflow-hidden rounded-xl">
        <img
          src={image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80'}
          alt={title}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${isArtist ? 'rounded-full' : 'rounded-xl'}`}
        />
        {badge && (
          <div className="absolute top-2 left-2 z-10">
            {badge}
          </div>
        )}
        {onPlay && (
          <button
            onClick={(e) => { e.stopPropagation(); onPlay(); }}
            className="absolute right-3 bottom-3 w-11 h-11 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 shadow-pink-500/30"
            title="Play"
          >
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </button>
        )}
      </div>

      <h3 className="font-bold text-sm text-white truncate mb-0.5 group-hover:text-pink-300 transition-colors">{title}</h3>
      {subtitle && <p className="text-xs text-muse-subtext truncate font-medium">{subtitle}</p>}
    </div>
  );
};

export default Card;
