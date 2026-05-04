import React, { useEffect, useState } from 'react';
import { socketClient } from '../lib/socket';

interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface ToastItem {
  id: string;
  achievement: AchievementDef;
  entering: boolean;
  exiting: boolean;
}

const RARITY_STYLES: Record<string, string> = {
  common: 'border-gray-400/50 bg-gray-800/95',
  rare: 'border-blue-400/60 bg-blue-950/95',
  epic: 'border-purple-400/60 bg-purple-950/95',
  legendary: 'border-yellow-400/70 bg-yellow-950/95',
};

const RARITY_GLOW: Record<string, string> = {
  common: '',
  rare: 'shadow-[0_0_20px_rgba(96,165,250,0.3)]',
  epic: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]',
  legendary: 'shadow-[0_0_30px_rgba(250,204,21,0.5)]',
};

const RARITY_TEXT: Record<string, string> = {
  common: 'text-gray-300',
  rare: 'text-blue-300',
  epic: 'text-purple-300',
  legendary: 'text-yellow-300',
};

export function AchievementToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = ({ achievements }: { achievements: AchievementDef[] }) => {
      achievements.forEach((achievement, i) => {
        setTimeout(() => {
          const toastId = `${achievement.id}_${Date.now()}`;
          // Start with entering:true so the slide-in animation fires
          setToasts(prev => [...prev, { id: toastId, achievement, entering: true, exiting: false }]);

          // Flip entering→false after one frame to trigger the CSS transition
          setTimeout(() => {
            setToasts(prev =>
              prev.map(t => t.id === toastId ? { ...t, entering: false } : t)
            );
          }, 50);

          // Auto dismiss after 5s
          setTimeout(() => {
            setToasts(prev =>
              prev.map(t => t.id === toastId ? { ...t, exiting: true } : t)
            );
            setTimeout(() => {
              setToasts(prev => prev.filter(t => t.id !== toastId));
            }, 400);
          }, 5000);
        }, i * 800);
      });
    };

    socketClient.on('achievementUnlocked', handler);
    return () => socketClient.off('achievementUnlocked', handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto
            flex items-center gap-4 px-5 py-4 rounded-2xl border
            backdrop-blur-md max-w-sm w-80
            transition-all duration-400
            ${RARITY_STYLES[toast.achievement.rarity]}
            ${RARITY_GLOW[toast.achievement.rarity]}
            ${toast.entering || toast.exiting
              ? 'opacity-0 translate-x-full'
              : 'opacity-100 translate-x-0'
            }
          `}
          style={{ transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          {/* Icon */}
          <div className="text-4xl flex-shrink-0 select-none">{toast.achievement.icon}</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-yellow-400 text-xs font-bold uppercase tracking-wider">
                Achievement Unlocked!
              </span>
            </div>
            <div className="text-white font-bold text-sm leading-tight">{toast.achievement.name}</div>
            <div className="text-gray-300 text-xs mt-0.5 leading-snug">{toast.achievement.description}</div>
            <div className={`text-xs font-semibold mt-1 ${RARITY_TEXT[toast.achievement.rarity]}`}>
              +{toast.achievement.points} pts · {toast.achievement.rarity.toUpperCase()}
            </div>
          </div>

          {/* Dismiss */}
          <button
            onClick={() => {
              setToasts(prev =>
                prev.map(t => t.id === toast.id ? { ...t, exiting: true } : t)
              );
              setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== toast.id));
              }, 400);
            }}
            className="text-gray-500 hover:text-white transition-colors flex-shrink-0 self-start mt-0.5"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
