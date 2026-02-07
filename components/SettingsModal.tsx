import React from 'react';
import { X, Clock, Palette, Volume2, VolumeX, User } from 'lucide-react';

export type TimeControl = 1 | 3 | 5 | 10 | 30;
export type BoardTheme = 'green' | 'brown' | 'blue' | 'slate' | 'purple' | 'burgundy';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeControl: TimeControl;
  setTimeControl: (t: TimeControl) => void;
  boardTheme: BoardTheme;
  setBoardTheme: (t: BoardTheme) => void;
  soundEnabled: boolean;
  setSoundEnabled: (s: boolean) => void;
  whiteName: string;
  setWhiteName: (n: string) => void;
  blackName: string;
  setBlackName: (n: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  timeControl,
  setTimeControl,
  boardTheme,
  setBoardTheme,
  soundEnabled,
  setSoundEnabled,
  whiteName,
  setWhiteName,
  blackName,
  setBlackName
}) => {
  if (!isOpen) return null;

  const themes: Record<BoardTheme, { label: string, color: string }> = {
    green: { label: 'Classic Green', color: 'bg-[#779556]' },
    brown: { label: 'Wood Brown', color: 'bg-[#b58863]' },
    blue: { label: 'Ocean Blue', color: 'bg-[#4b7399]' },
    slate: { label: 'Dark Slate', color: 'bg-slate-500' },
    purple: { label: 'Royal Purple', color: 'bg-[#8b5cf6]' },
    burgundy: { label: 'Deep Burgundy', color: 'bg-[#9f1239]' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Settings
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* Player Names */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <User size={16} /> Player Names
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-medium">White</label>
                <input 
                  type="text" 
                  value={whiteName}
                  maxLength={12}
                  onChange={(e) => setWhiteName(e.target.value)}
                  onBlur={() => { if (!whiteName.trim()) setWhiteName('White'); }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-600"
                  placeholder="White"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-medium">Black</label>
                <input 
                  type="text" 
                  value={blackName}
                  maxLength={12}
                  onChange={(e) => setBlackName(e.target.value)}
                  onBlur={() => { if (!blackName.trim()) setBlackName('Black'); }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-600"
                  placeholder="Black"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-800" />
          
          {/* Time Control */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Clock size={16} /> Time Control (Minutes)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 3, 5, 10, 30].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeControl(t as TimeControl)}
                  className={`py-2 rounded-lg text-sm font-bold transition-all
                    ${timeControl === t 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  {t}m
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 text-center">Changes apply on next game reset.</p>
          </div>

          <hr className="border-slate-800" />

          {/* Board Theme */}
          <div className="space-y-3">
             <label className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Palette size={16} /> Board Theme
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(themes) as BoardTheme[]).map((theme) => (
                <button
                  key={theme}
                  onClick={() => setBoardTheme(theme)}
                  className={`flex items-center gap-3 p-2 rounded-xl border-2 transition-all
                    ${boardTheme === theme ? 'border-indigo-500 bg-slate-800' : 'border-transparent bg-slate-800/50 hover:bg-slate-800'}`}
                >
                  <div className={`w-8 h-8 rounded-md shadow-sm ${themes[theme].color}`}></div>
                  <span className="text-sm font-medium text-slate-200">{themes[theme].label}</span>
                </button>
              ))}
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Sound */}
           <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />} Sound Effects
              </label>
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${soundEnabled ? 'bg-indigo-600' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${soundEnabled ? 'left-7' : 'left-1'}`} />
              </button>
           </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/50 border-t border-slate-800 mt-auto">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};