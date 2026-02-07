import React from 'react';
import { AnalysisResult } from '../types';
import { X, BrainCircuit, Lightbulb } from 'lucide-react';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AnalysisResult | null;
  loading: boolean;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ isOpen, onClose, analysis, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-2 text-indigo-400">
            <BrainCircuit size={24} />
            <h2 className="text-lg font-bold text-white">Gemini Coach</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 animate-pulse">Analyzing position...</p>
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              {/* Evaluation Badge */}
              <div className="text-center">
                <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide uppercase
                  ${analysis.evaluation.toLowerCase().includes('white') ? 'bg-white text-slate-900' : 
                    analysis.evaluation.toLowerCase().includes('black') ? 'bg-slate-700 text-white' : 
                    'bg-slate-600 text-slate-200'}`}>
                  {analysis.evaluation}
                </span>
              </div>

              {/* Best Move */}
              {analysis.bestMove && (
                <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4 flex items-start gap-3">
                  <Lightbulb className="text-yellow-400 shrink-0 mt-1" size={20} />
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">Suggested Move</h3>
                    <p className="text-2xl font-bold text-white">{analysis.bestMove}</p>
                  </div>
                </div>
              )}

              {/* Explanation */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Strategic Insight</h3>
                <p className="text-slate-200 leading-relaxed text-lg">
                  {analysis.explanation}
                </p>
              </div>
            </div>
          ) : (
             <div className="text-center text-slate-500">No analysis available.</div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-slate-950/50 border-t border-slate-800">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
          >
            Back to Game
          </button>
        </div>
      </div>
    </div>
  );
};
