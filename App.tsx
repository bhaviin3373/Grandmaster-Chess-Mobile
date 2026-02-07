import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, Square, Move } from 'https://esm.sh/chess.js@1.0.0-beta.8';
import { ChessPiece, AnimatedChessPiece } from './components/Pieces';
import { AnalysisModal } from './components/AnalysisModal';
import { SettingsModal, TimeControl, BoardTheme } from './components/SettingsModal';
import { analyzeBoard, getCoachTip } from './services/geminiService';
import { 
  RotateCcw, 
  BrainCircuit, 
  Settings, 
  Trophy, 
  Users,
  ChevronLeft,
  Lightbulb,
  AlertTriangle,
  Zap,
  Clock
} from 'lucide-react';

// Color types
type Color = 'w' | 'b';

const App: React.FC = () => {
  // Game Engine - Use Ref to persist history for Undo functionality
  const gameRef = useRef(new Chess());
  
  // Reactive State for UI
  const [fen, setFen] = useState(gameRef.current.fen());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  const [turn, setTurn] = useState<Color>('w');
  const [isCheck, setIsCheck] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameStatus, setGameStatus] = useState<string>('');
  
  // UI State
  const [orientation, setOrientation] = useState<Color>('w');
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [coachTip, setCoachTip] = useState<string>('');
  const [lastMove, setLastMove] = useState<{from: string, to: string, flags?: string} | null>(null);
  const [historyCount, setHistoryCount] = useState(0); 
  
  // Helper for localStorage
  const getSavedSetting = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // Settings State - Initialize from localStorage
  const [timeControl, setTimeControl] = useState<TimeControl>(() => getSavedSetting('chess_timeControl', 10));
  const [boardTheme, setBoardTheme] = useState<BoardTheme>(() => getSavedSetting('chess_boardTheme', 'green'));
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => getSavedSetting('chess_soundEnabled', true));
  const [whiteName, setWhiteName] = useState<string>(() => getSavedSetting('chess_whiteName', 'White'));
  const [blackName, setBlackName] = useState<string>(() => getSavedSetting('chess_blackName', 'Black'));

  // Persist Settings
  useEffect(() => {
    localStorage.setItem('chess_timeControl', JSON.stringify(timeControl));
    localStorage.setItem('chess_boardTheme', JSON.stringify(boardTheme));
    localStorage.setItem('chess_soundEnabled', JSON.stringify(soundEnabled));
    localStorage.setItem('chess_whiteName', JSON.stringify(whiteName));
    localStorage.setItem('chess_blackName', JSON.stringify(blackName));
  }, [timeControl, boardTheme, soundEnabled, whiteName, blackName]);

  // Suggestion State
  const [suggestedMove, setSuggestedMove] = useState<{from: string, to: string} | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  // Timer State (in seconds)
  const [whiteTime, setWhiteTime] = useState(timeControl * 60);
  const [blackTime, setBlackTime] = useState(timeControl * 60);

  // Computed display names (fallback to default if empty)
  const displayWhiteName = whiteName.trim() || 'White';
  const displayBlackName = blackName.trim() || 'Black';

  // Refs for sound
  const moveSound = useRef<HTMLAudioElement | null>(null);
  const captureSound = useRef<HTMLAudioElement | null>(null);
  const checkSound = useRef<HTMLAudioElement | null>(null);
  const gameEndSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    moveSound.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-chess-clock-click-1107.mp3'); 
    captureSound.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-light-impact-on-the-ground-3382.mp3');
    checkSound.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-alert-2573.mp3');
    gameEndSound.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3');
  }, []);

  const playSound = (sound: React.MutableRefObject<HTMLAudioElement | null>) => {
    if (soundEnabled && sound.current) {
      sound.current.currentTime = 0;
      sound.current.play().catch(() => {});
    }
  };

  // Timer Logic
  useEffect(() => {
    if (gameOver) return;

    const timerInterval = setInterval(() => {
      if (turn === 'w') {
        setWhiteTime((prev) => {
          if (prev <= 0) return 0;
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 0) return 0;
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [turn, gameOver]);

  // Check for Timeout
  useEffect(() => {
    if (gameOver) return;
    
    if (whiteTime <= 0) {
      setGameOver(true);
      setGameStatus(`${displayBlackName} wins on time!`);
      playSound(gameEndSound);
    } else if (blackTime <= 0) {
      setGameOver(true);
      setGameStatus(`${displayWhiteName} wins on time!`);
      playSound(gameEndSound);
    }
  }, [whiteTime, blackTime, gameOver, displayWhiteName, displayBlackName]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const updateGameState = useCallback(() => {
    const game = gameRef.current;
    setFen(game.fen());
    setTurn(game.turn());
    const inCheck = game.inCheck();
    setIsCheck(inCheck);
    
    // Update history tracking
    const history = game.history({ verbose: true });
    setHistoryCount(history.length);
    
    if (history.length > 0) {
      const last = history[history.length - 1];
      setLastMove({ from: last.from, to: last.to, flags: last.flags });
    } else {
      setLastMove(null);
    }
    
    if (game.isGameOver()) {
      setGameOver(true);
      if (game.isCheckmate()) {
        const winner = game.turn() === 'w' ? displayBlackName : displayWhiteName;
        setGameStatus(`Checkmate! ${winner} wins.`);
        playSound(gameEndSound);
      }
      else if (game.isDraw()) setGameStatus('Draw!');
      else if (game.isStalemate()) setGameStatus('Stalemate!');
      else setGameStatus('Game Over');
    } else {
      // Only un-set game over if we are not in a timeout state
      if (whiteTime > 0 && blackTime > 0) {
        setGameOver(false);
        setGameStatus('');
      }
      if (inCheck) {
        playSound(checkSound);
      }
    }
  }, [whiteTime, blackTime, displayWhiteName, displayBlackName]);

  // Handle Square Click
  const onSquareClick = (square: Square) => {
    if (gameOver) return;
    const game = gameRef.current;

    // If touching same square, deselect
    if (selectedSquare === square) {
      setSelectedSquare(null);
      setPossibleMoves([]);
      return;
    }

    // Attempt Move
    if (selectedSquare) {
      try {
        const moveAttempt = {
          from: selectedSquare,
          to: square,
          promotion: 'q', // Always promote to queen for simplicity
        };

        // Validate and Move
        let moveResult;
        try {
          moveResult = game.move(moveAttempt);
        } catch (e) {
          moveResult = null;
        }

        if (moveResult) {
          // Move successful
          if (moveResult.captured) {
            playSound(captureSound);
          } else {
            playSound(moveSound);
          }

          setSelectedSquare(null);
          setPossibleMoves([]);
          setSuggestedMove(null); // Clear suggestion on move
          updateGameState();
          
          // Trigger optional coach tip
          if (Math.random() > 0.7) { 
             getCoachTip(game.fen(), moveResult.san).then(tip => setCoachTip(tip));
          } else {
             setCoachTip('');
          }
          return;
        }
      } catch (e) {
        // Invalid move
      }
    }

    // Select new square
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      // Get legal moves for this piece
      const moves = game.moves({ square, verbose: true }).map((m: any) => m.to);
      setPossibleMoves(moves);
    } else {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  const undoMove = () => {
    const game = gameRef.current;
    if (game.history().length === 0) return;
    
    game.undo();
    setSelectedSquare(null);
    setPossibleMoves([]);
    setSuggestedMove(null);
    setCoachTip('');
    updateGameState();
  };

  const resetGame = () => {
    const game = gameRef.current;
    game.reset();
    setWhiteTime(timeControl * 60);
    setBlackTime(timeControl * 60);
    setCoachTip('');
    setSelectedSquare(null);
    setPossibleMoves([]);
    setSuggestedMove(null);
    updateGameState();
  };

  const handleAnalyze = async () => {
    setIsAnalysisOpen(true);
    setAnalysisLoading(true);
    const game = gameRef.current;
    const result = await analyzeBoard(game.fen(), game.turn());
    setAnalysisResult(result);
    setAnalysisLoading(false);
  };

  const handleSuggestMove = async () => {
    if (gameOver) return;
    setSuggestionLoading(true);
    setSuggestedMove(null);
    
    const game = gameRef.current;
    const result = await analyzeBoard(game.fen(), game.turn());
    
    if (result.bestMove) {
      // Find the actual move object to get from/to coordinates from SAN
      const moves = game.moves({ verbose: true });
      const bestMoveObj = moves.find((m: any) => m.san === result.bestMove);
      
      if (bestMoveObj) {
        setSuggestedMove({ from: bestMoveObj.from, to: bestMoveObj.to });
      }
    }
    setSuggestionLoading(false);
  };

  const boardRows = [8, 7, 6, 5, 4, 3, 2, 1];
  const boardCols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  // Adjust board for orientation
  const displayRows = orientation === 'w' ? boardRows : [...boardRows].reverse();
  const displayCols = orientation === 'w' ? boardCols : [...boardCols].reverse();

  // Helper for check status display
  const getPlayerStatus = (playerColor: Color) => {
    const isTurn = turn === playerColor;
    const isPlayerInCheck = isCheck && isTurn;
    const isWinner = gameOver && gameStatus.includes(playerColor === 'w' ? 'White wins' : 'Black wins');
    const timeLeft = playerColor === 'w' ? whiteTime : blackTime;
    
    return { isTurn, isPlayerInCheck, isWinner, timeLeft };
  };

  const opponentColor = orientation === 'w' ? 'b' : 'w';
  const playerColor = orientation === 'w' ? 'w' : 'b';

  const opponentStatus = getPlayerStatus(opponentColor);
  const playerStatus = getPlayerStatus(playerColor);

  // Theme Logic
  const getThemeColors = (isBlack: boolean) => {
    switch (boardTheme) {
      case 'brown': return isBlack ? 'bg-[#b58863]' : 'bg-[#f0d9b5]';
      case 'blue': return isBlack ? 'bg-[#4b7399]' : 'bg-[#eae9d2]';
      case 'slate': return isBlack ? 'bg-slate-600' : 'bg-slate-400';
      case 'purple': return isBlack ? 'bg-[#8b5cf6]' : 'bg-[#e9d5ff]';
      case 'burgundy': return isBlack ? 'bg-[#9f1239]' : 'bg-[#fecdd3]';
      case 'green':
      default: return isBlack ? 'bg-[#779556]' : 'bg-[#ebecd0]';
    }
  };
  
  const getThemeTextColors = (isBlack: boolean) => {
     switch (boardTheme) {
      case 'brown': return isBlack ? 'text-[#f0d9b5]' : 'text-[#b58863]';
      case 'blue': return isBlack ? 'text-[#eae9d2]' : 'text-[#4b7399]';
      case 'slate': return isBlack ? 'text-slate-400' : 'text-slate-600';
      case 'purple': return isBlack ? 'text-[#e9d5ff]' : 'text-[#8b5cf6]';
      case 'burgundy': return isBlack ? 'text-[#fecdd3]' : 'text-[#9f1239]';
      case 'green':
      default: return isBlack ? 'text-[#ebecd0]' : 'text-[#779556]';
    }
  }

  const TimerDisplay = ({ time, isTurn, isLowTime }: { time: number, isTurn: boolean, isLowTime: boolean }) => (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all duration-300 font-mono text-lg sm:text-xl font-bold min-w-[4.5rem] sm:min-w-[5rem] justify-center transform
      ${isTurn ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] scale-105' : 'bg-slate-800 border-slate-700 text-slate-500'}
      ${isLowTime && isTurn ? '!bg-red-600 !border-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]' : ''}
    `}>
      <Clock size={14} className={`${isTurn ? 'text-white' : 'text-slate-600'}`} />
      <span>{formatTime(time)}</span>
    </div>
  );

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-slate-950 text-slate-100 select-none overflow-hidden">
      
      {/* Top Bar */}
      <header className="shrink-0 flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 z-10">
        <div className="flex items-center gap-2">
          <Trophy className="text-yellow-500" size={18} />
          <h1 className="text-base font-bold tracking-tight">Grandmaster</h1>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setOrientation(o => o === 'w' ? 'b' : 'w')} className="p-2 text-slate-400 hover:text-white transition-colors">
              <RotateCcw size={18} className="rotate-90"/>
           </button>
           <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
           >
              <Settings size={18} />
           </button>
        </div>
      </header>

      {/* Opponent Info */}
      <div className={`shrink-0 flex justify-between items-center px-3 py-2 transition-colors duration-300 ${opponentStatus.isPlayerInCheck ? 'bg-red-900/20' : 'bg-slate-950/50'}`}>
        <div className="flex items-center gap-2">
           <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-all duration-300
             ${opponentStatus.isTurn ? 'bg-slate-700 border-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.3)]' : 'bg-slate-800 border-slate-700'}
             ${opponentStatus.isPlayerInCheck ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse' : ''}
           `}>
             <Users size={16} className="text-slate-400"/>
           </div>
           <div>
             <div className="flex items-center gap-2">
                <p className={`font-semibold text-xs sm:text-sm ${opponentStatus.isTurn ? 'text-white' : 'text-slate-400'}`}>
                    {opponentColor === 'w' ? displayWhiteName : displayBlackName}
                </p>
                {opponentStatus.isPlayerInCheck && !gameOver && (
                    <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30 animate-pulse">
                        <AlertTriangle size={10} /> Check
                    </span>
                )}
             </div>
             <p className="text-[10px] sm:text-xs text-slate-500">{opponentStatus.isTurn ? 'Thinking...' : 'Waiting'}</p>
           </div>
        </div>
        
        {/* Opponent Timer */}
        <TimerDisplay 
          time={opponentStatus.timeLeft} 
          isTurn={opponentStatus.isTurn && !gameOver} 
          isLowTime={opponentStatus.timeLeft < 60} 
        />
      </div>

      {/* Chess Board Container */}
      {/* flex-1 with min-h-0 is critical for letting the board shrink in height */}
      <div className="flex-1 flex items-center justify-center w-full min-h-0 p-2 overflow-hidden">
        <div className="relative aspect-square max-h-full max-w-full shadow-2xl rounded-sm overflow-hidden border-4 border-slate-800">
            {/* Grid */}
            <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
              {displayRows.map((row) => (
                displayCols.map((col, colIndex) => {
                  const square = `${col}${row}` as Square;
                  const isBlackSquare = (boardRows.indexOf(row) + boardCols.indexOf(col)) % 2 === 1; 
                  const game = gameRef.current;
                  const piece = game.get(square);
                  
                  const isSelected = selectedSquare === square;
                  const isPossibleMove = possibleMoves.includes(square);
                  const isLastMoveFrom = lastMove?.from === square;
                  const isLastMoveTo = lastMove?.to === square;
                  
                  const isSuggestedFrom = suggestedMove?.from === square;
                  const isSuggestedTo = suggestedMove?.to === square;

                  const isKing = piece?.type === 'k' && piece?.color === turn;
                  const isKingInCheck = isCheck && isKing;

                  // Compute background color
                  let bgColor = getThemeColors(isBlackSquare);
                  
                  // Overlays
                  if (isSelected) bgColor = 'bg-yellow-200/80'; 
                  else if (isLastMoveFrom || isLastMoveTo) bgColor = isBlackSquare ? 'bg-yellow-600/60' : 'bg-yellow-200/60';
                  
                  // Suggestion Highlight
                  const suggestionHighlight = (isSuggestedFrom || isSuggestedTo) ? 'ring-inset ring-4 ring-indigo-500' : '';

                  // Calculate animation props if this piece just arrived
                  let animationOffset = null;
                  if (isLastMoveTo && lastMove) {
                     const fromRowIndex = displayRows.indexOf(parseInt(lastMove.from[1]));
                     const fromColIndex = displayCols.indexOf(lastMove.from[0]);
                     const toRowIndex = displayRows.indexOf(parseInt(lastMove.to[1]));
                     const toColIndex = displayCols.indexOf(lastMove.to[0]);
                     
                     // If we found the squares in the current display grid
                     if (fromRowIndex !== -1 && toRowIndex !== -1) {
                         animationOffset = {
                             x: fromColIndex - toColIndex,
                             y: fromRowIndex - toRowIndex
                         };
                     }
                  }

                  return (
                    <div 
                      key={square} 
                      onClick={() => onSquareClick(square)}
                      className={`relative flex items-center justify-center w-full h-full cursor-pointer ${bgColor} ${suggestionHighlight} transition-colors duration-75`}
                    >
                      {/* Rank/File Labels - Hidden on very small screens? No, just made tiny */}
                      {colIndex === 0 && orientation === 'w' && (
                         <span className={`absolute top-0.5 left-0.5 text-[7px] sm:text-[10px] font-bold ${getThemeTextColors(isBlackSquare)}`}>
                            {row}
                         </span>
                      )}
                      {row === (orientation === 'w' ? 1 : 8) && (
                         <span className={`absolute bottom-0 right-0.5 text-[7px] sm:text-[10px] font-bold ${getThemeTextColors(isBlackSquare)}`}>
                            {col}
                         </span>
                      )}

                      {/* Piece */}
                      {piece && (
                        <AnimatedChessPiece 
                            key={`${square}-${piece.type}-${piece.color}`} // Key ensures remount on capture/change, but animation depends on this being a "new" arrival at this square
                            type={piece.type} 
                            color={piece.color}
                            isSelected={isSelected}
                            animateFrom={animationOffset}
                        />
                      )}
                      
                      {/* Suggestion Marker for destination if empty */}
                      {isSuggestedTo && !piece && (
                         <div className="absolute w-2 h-2 sm:w-3 sm:h-3 bg-indigo-500 rounded-full animate-pulse" />
                      )}

                      {/* Check Indicator (King Halo) */}
                      {isKingInCheck && (
                         <div className="absolute inset-0 z-10">
                            <div className="absolute inset-0 rounded-full bg-red-600/50 blur-md animate-pulse"></div>
                         </div>
                      )}

                      {/* Move Hint Dot */}
                      {isPossibleMove && !piece && (
                        <div className="absolute w-[20%] h-[20%] bg-black/20 rounded-full pointer-events-none" />
                      )}
                      {/* Capture Hint Ring */}
                      {isPossibleMove && piece && (
                         <div className="absolute inset-0 border-[3px] sm:border-[4px] border-black/20 rounded-full pointer-events-none" />
                      )}
                    </div>
                  );
                })
              ))}
            </div>
            
            {/* Game Over Overlay */}
            {gameOver && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
                <div className="bg-slate-900 border border-slate-700 p-4 sm:p-6 rounded-2xl shadow-2xl text-center max-w-[80%]">
                  <Trophy className="mx-auto text-yellow-500 mb-2" size={24} />
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Game Over</h2>
                  <p className="text-slate-300 mb-4 sm:mb-6 text-xs sm:text-sm">{gameStatus}</p>
                  <button 
                    onClick={resetGame}
                    className="px-4 py-2 sm:px-6 sm:py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-900/30 transition-all active:scale-95 text-sm"
                  >
                    Start New Game
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Player Info (Self) & Coach Tip */}
      <div className="shrink-0 flex flex-col gap-2 px-3 pb-2 z-10">
        {coachTip && (
           <div className="bg-slate-800/80 border border-slate-700 p-2 rounded-xl flex gap-3 items-start animate-fade-in mb-1">
              <div className="p-1 bg-indigo-500/10 rounded-lg shrink-0">
                <Lightbulb size={14} className="text-indigo-400" />
              </div>
              <p className="text-xs sm:text-sm text-slate-300 italic leading-snug">"{coachTip}"</p>
           </div>
        )}

        <div className={`flex justify-between items-center py-2 transition-colors duration-300 rounded-xl px-2 -mx-2
           ${playerStatus.isPlayerInCheck ? 'bg-red-900/20' : 'bg-slate-950/50'}`}>
           <div className="flex items-center gap-2">
             <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300
                ${playerStatus.isTurn ? 'bg-indigo-600 shadow-indigo-900/20' : 'bg-slate-800'}
                ${playerStatus.isPlayerInCheck ? 'ring-2 ring-red-500 animate-pulse' : ''}
             `}>
               <Users size={16} className="text-white"/>
             </div>
             <div>
               <div className="flex items-center gap-2">
                  <p className={`font-semibold text-xs sm:text-sm ${playerStatus.isTurn ? 'text-white' : 'text-slate-400'}`}>
                      {playerColor === 'w' ? displayWhiteName : displayBlackName}
                  </p>
                  {playerStatus.isPlayerInCheck && !gameOver && (
                      <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30 animate-pulse">
                          <AlertTriangle size={10} /> Check
                      </span>
                  )}
               </div>
               <p className="text-[10px] sm:text-xs text-slate-500">{playerStatus.isTurn ? 'Your Turn' : 'Waiting'}</p>
             </div>
           </div>
           
           {/* Player Timer */}
           <TimerDisplay 
             time={playerStatus.timeLeft} 
             isTurn={playerStatus.isTurn && !gameOver} 
             isLowTime={playerStatus.timeLeft < 60} 
           />
        </div>
      </div>

      {/* Controls */}
      <div className="shrink-0 px-3 pb-4 pt-1 z-10 safe-area-bottom">
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
           {/* Reset */}
           <button 
             onClick={resetGame}
             className="flex flex-col items-center justify-center gap-1 p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all active:scale-95"
           >
             <RotateCcw size={18} className="text-slate-400" />
             <span className="text-[9px] sm:text-[10px] font-medium text-slate-500">Reset</span>
           </button>
           
           {/* Takeback */}
           <button 
             onClick={undoMove}
             disabled={historyCount === 0 || gameOver}
             className={`flex flex-col items-center justify-center gap-1 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-800 transition-all active:scale-95
               ${historyCount > 0 && !gameOver ? 'bg-slate-900 hover:bg-slate-800 cursor-pointer' : 'bg-slate-900/50 opacity-50 cursor-not-allowed'}
             `}
           >
             <ChevronLeft size={18} className="text-slate-400" />
             <span className="text-[9px] sm:text-[10px] font-medium text-slate-500">Takeback</span>
           </button>

           {/* Hint / Suggest Best Move */}
           <button 
             onClick={handleSuggestMove}
             disabled={gameOver || suggestionLoading}
             className={`flex flex-col items-center justify-center gap-1 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-800 transition-all active:scale-95
                bg-slate-900 hover:bg-slate-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
             `}
           >
             {suggestionLoading ? (
                 <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
             ) : (
                 <Zap size={18} className="text-yellow-500" />
             )}
             <span className="text-[9px] sm:text-[10px] font-medium text-slate-500">Hint</span>
           </button>

           {/* Analyze / Coach */}
           <button 
             onClick={handleAnalyze}
             disabled={gameOver}
             className="flex flex-col items-center justify-center gap-1 p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             <BrainCircuit size={18} className="text-white" />
             <span className="text-[9px] sm:text-[10px] font-bold text-white">Coach</span>
           </button>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        timeControl={timeControl}
        setTimeControl={setTimeControl}
        boardTheme={boardTheme}
        setBoardTheme={setBoardTheme}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        whiteName={whiteName}
        setWhiteName={setWhiteName}
        blackName={blackName}
        setBlackName={setBlackName}
      />

      {/* Analysis Modal */}
      <AnalysisModal 
        isOpen={isAnalysisOpen} 
        onClose={() => setIsAnalysisOpen(false)} 
        analysis={analysisResult}
        loading={analysisLoading}
      />

    </div>
  );
};

export default App;