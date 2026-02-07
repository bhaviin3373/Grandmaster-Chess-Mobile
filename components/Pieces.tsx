import React, { useLayoutEffect, useState } from 'react';

interface PieceProps {
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  color: 'w' | 'b';
  className?: string;
}

export const ChessPiece: React.FC<PieceProps> = ({ type, color, className }) => {
  const isWhite = color === 'w';
  const fillId = `gradient-${color}`;
  
  // Define gradients: White pieces (Silver/White), Black pieces (Black/Dark Grey)
  const gradient = (
    <defs>
      <linearGradient id={`${fillId}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={isWhite ? "#f8fafc" : "#334155"} />
        <stop offset="100%" stopColor={isWhite ? "#cbd5e1" : "#020617"} />
      </linearGradient>
    </defs>
  );

  // Stroke color for contrast
  const stroke = isWhite ? '#1e293b' : '#e2e8f0'; 
  const strokeWidth = 1.5;

  const pieces: Record<string, React.ReactNode> = {
    // Pawn: Round head, curved body, wide base
    p: (
      <g transform="translate(0,0) scale(1)">
        {gradient}
        <path
          d="M22.5 9C19.5 9 17 11.5 17 14.5C17 16.5 18.2 18.2 20 19C17.5 21.5 15.5 25.5 15 31H30C29.5 25.5 27.5 21.5 25 19C26.8 18.2 28 16.5 28 14.5C28 11.5 25.5 9 22.5 9Z M14 33H31V37H14V33Z"
          fill={`url(#${fillId})`}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      </g>
    ),

    // Knight: Realistic Horse Head with Animation
    n: (
      <g transform="translate(0,0) scale(1)">
        {gradient}
        <defs>
          <style>
            {`
              @keyframes blink-${color} {
                0%, 90%, 100% { transform: scaleY(1); }
                95% { transform: scaleY(0.1); }
              }
              .knight-eye-${color} {
                animation: blink-${color} 5s infinite;
                transform-box: fill-box;
                transform-origin: center;
              }
              @keyframes mane-flow-${color} {
                0%, 100% { transform: skewX(0deg); }
                50% { transform: skewX(-3deg); }
              }
              .knight-mane-${color} {
                animation: mane-flow-${color} 4s ease-in-out infinite;
                transform-origin: bottom;
                transform-box: fill-box;
              }
            `}
          </style>
        </defs>

        {/* Base */}
        <path
           d="M12 33 L12 37 L33 37 L33 33 L31 31 L14 31 Z"
           fill={`url(#${fillId})`}
           stroke={stroke}
           strokeWidth={strokeWidth}
           strokeLinejoin="round"
        />

        {/* Head/Body */}
        <path
           d="M14 31 C15 24 16 17 18 13 L17.5 9 L20 10.5 L22 7 Q26 8 30 13 L32 17 L28 19.5 Q27 22 29 31 H14 Z"
           fill={`url(#${fillId})`}
           stroke={stroke}
           strokeWidth={strokeWidth}
           strokeLinejoin="round"
        />
        
        {/* Mane Details (Animated) */}
        <g className={`knight-mane-${color}`}>
           <path d="M18 13 C17 16 17 20 18 24" stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" />
           <path d="M20 10.5 C19.5 13 19.5 16 20.5 19" stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" />
           <path d="M22 7 C22.5 9 23 11 24 13" stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </g>

        {/* Eye (Animated) */}
        <ellipse cx="24.5" cy="12.5" rx="1.2" ry="1.2" fill={stroke} className={`knight-eye-${color}`} />

        {/* Nostril */}
        <path d="M30 16 A 0.7 0.7 0 0 1 29 17" stroke={stroke} strokeWidth="0.8" fill="none" />
      </g>
    ),

    // Bishop: Mitre shape with cut
    b: (
      <g transform="translate(0,0) scale(1)">
        {gradient}
        <path
           d="M22.5 6C19 6 17 9 17 12C17 14 18 15.5 19 16.5C18 19 16 25 15 31H30C29 25 27 19 26 16.5C27 15.5 28 14 28 12C28 9 26 6 22.5 6Z M22.5 3C23.5 3 24 3.5 24 4.5C24 5.5 23.5 6 22.5 6C21.5 6 21 5.5 21 4.5C21 3.5 21.5 3 22.5 3Z M15 33H30V37H15V33Z"
           fill={`url(#${fillId})`}
           stroke={stroke}
           strokeWidth={strokeWidth}
           strokeLinejoin="round"
        />
        {/* Slit */}
        <path d="M21 9L24 12" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d="M19 16.5H26" stroke={stroke} strokeWidth="1" />
      </g>
    ),

    // Rook: Castle tower with crenellations
    r: (
      <g transform="translate(0,0) scale(1)">
        {gradient}
        <path
           d="M13 33H32V37H13V33Z M14 31H31C30 24 29 19 29 16H31V9H27V11H25V9H20V11H18V9H14V16H16C16 19 15 24 14 31Z"
           fill={`url(#${fillId})`}
           stroke={stroke}
           strokeWidth={strokeWidth}
           strokeLinejoin="round"
        />
        {/* Detail lines */}
        <path d="M16 16H29" stroke={stroke} strokeWidth="1" />
      </g>
    ),

    // Queen: Crown with ball top
    q: (
      <g transform="translate(0,0) scale(1)">
         {gradient}
         <path
            d="M13 33H32V37H13V33Z M14 31H31C30 24 28 18 28 16C31 13 31 10 29 9C27 10 26 11 25.5 12C25 10 24 8 22.5 8C21 8 20 10 19.5 12C19 11 18 10 16 9C14 10 14 13 17 16C17 18 15 24 14 31Z"
            fill={`url(#${fillId})`}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
        />
        {/* Top ball */}
        <circle cx="22.5" cy="5" r="2.5" fill={`url(#${fillId})`} stroke={stroke} strokeWidth={strokeWidth}/>
        <circle cx="22.5" cy="18" r="1" fill={stroke} />
      </g>
    ),

    // King: Robust with intricate cross
    k: (
      <g transform="translate(0,0) scale(1)">
         {gradient}
         {/* Base */}
         <path 
           d="M12 34 L12 37 L33 37 L33 34 L31 32 L14 32 Z" 
           fill={`url(#${fillId})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round"
         />
         {/* Body */}
         <path 
           d="M14.5 32 C15.5 26 16.5 20 17 18 H28 C28.5 20 29.5 26 30.5 32" 
           fill={`url(#${fillId})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round"
         />
         {/* Shoulder/Collar */}
         <path d="M16 18 L16 15 L29 15 L29 18 Z" fill={`url(#${fillId})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round"/>
         
         {/* Head/Crown Base */}
         <path d="M16.5 15 L16.5 11 L28.5 11 L28.5 15 Z" fill={`url(#${fillId})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round"/>
         
         {/* Intricate Cross */}
         <path 
           d="M22.5 2 Q24 2 24.5 3.5 L25 5 H28 Q29 5 29 6 V7 Q29 8 28 8 H25 L24.5 9.5 Q24 11 22.5 11 Q21 11 20.5 9.5 L20 8 H17 Q16 8 16 7 V6 Q16 5 17 5 H20 L20.5 3.5 Q21 2 22.5 2 Z"
           fill={`url(#${fillId})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round"
         />
         
         {/* Details */}
         <line x1="17" y1="13" x2="28" y2="13" stroke={stroke} strokeWidth="1" />
         <line x1="17" y1="16.5" x2="28" y2="16.5" stroke={stroke} strokeWidth="1" />
         <line x1="22.5" y1="5" x2="22.5" y2="8" stroke={stroke} strokeWidth="1" />
         <line x1="20" y1="6.5" x2="25" y2="6.5" stroke={stroke} strokeWidth="1" />
      </g>
    )
  };

  const svgContent = pieces[type.toLowerCase()];

  return (
    <svg 
      viewBox="0 0 45 45" 
      className={`w-full h-full drop-shadow-lg ${className}`}
      style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.3))' }}
    >
      {svgContent}
    </svg>
  );
};

interface AnimatedPieceProps {
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  color: 'w' | 'b';
  isSelected?: boolean;
  animateFrom?: { x: number; y: number } | null;
}

export const AnimatedChessPiece: React.FC<AnimatedPieceProps> = ({ 
  type, 
  color, 
  isSelected, 
  animateFrom 
}) => {
  const [style, setStyle] = useState<React.CSSProperties>({});
  
  useLayoutEffect(() => {
    if (animateFrom) {
      setStyle({
        transform: `translate(${animateFrom.x * 100}%, ${animateFrom.y * 100}%)`,
        transition: 'none', 
        zIndex: 20
      });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setStyle({
            transform: 'translate(0, 0)',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', 
            zIndex: 20
          });
        });
      });
    } else {
       setStyle({
          transform: isSelected ? 'translateY(-15%) scale(1.1)' : 'translate(0,0)',
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          filter: isSelected ? 'drop-shadow(0 10px 8px rgba(0,0,0,0.5))' : 'drop-shadow(0px 2px 2px rgba(0,0,0,0.3))'
       });
    }
  }, []);

  useLayoutEffect(() => {
     if (!animateFrom) {
        setStyle({
            transform: isSelected ? 'translateY(-15%) scale(1.1)' : 'translate(0,0)',
            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: isSelected ? 'drop-shadow(0 10px 8px rgba(0,0,0,0.5))' : 'drop-shadow(0px 2px 2px rgba(0,0,0,0.3))'
        });
     }
  }, [isSelected]);

  return (
    <div className="w-[85%] h-[85%]" style={style}>
       <ChessPiece type={type} color={color} />
    </div>
  );
};
