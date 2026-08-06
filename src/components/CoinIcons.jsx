import React from 'react';

// 🥇 1. LORD CHAITANYA MAHAPRABHU EMBOSSED GOLD COIN
// Inspired by Image 1: Lord Chaitanya dancing with wide open raised arms, flower garland & flowing sash
export const ChaitanyaCoinIcon = ({ size = 32, style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 50 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 3px 8px rgba(251,191,36,0.6))', cursor: 'pointer', ...style }}
  >
    <defs>
      {/* Metallic Gold Gradient */}
      <radialGradient id="goldCoinBase" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#fffbeb" />
        <stop offset="30%" stopColor="#fef08a" />
        <stop offset="60%" stopColor="#f59e0b" />
        <stop offset="85%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#78350f" />
      </radialGradient>
      
      {/* 3D Emboss Bevel */}
      <linearGradient id="goldBevel" x1="0" y1="0" x2="50" y2="50">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#451a03" stopOpacity="0.9" />
      </linearGradient>

      {/* Embossed Metallic Inner Shadow */}
      <filter id="goldEmbossShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="1" dy="1.5" stdDeviation="0.8" floodColor="#78350f" floodOpacity="0.8" />
      </filter>
    </defs>

    {/* Outer 3D Coin Edge */}
    <circle cx="25" cy="25" r="23.5" fill="url(#goldCoinBase)" stroke="url(#goldBevel)" strokeWidth="2.5" />
    <circle cx="25" cy="25" r="21" fill="none" stroke="#fef08a" strokeWidth="0.8" strokeDasharray="1.5 1.5" opacity="0.8" />
    
    {/* Inner Coin Ring */}
    <circle cx="25" cy="25" r="19.5" fill="none" stroke="#78350f" strokeWidth="0.6" opacity="0.4" />

    {/* Divine Rays / Halo in Gold Relief */}
    <circle cx="25" cy="14" r="6" fill="#fef9c3" opacity="0.3" />

    {/* Embossed Figure Group: Lord Chaitanya (Hands Wide Open Dancing Stance) */}
    <g filter="url(#goldEmbossShadow)">
      {/* Head & Hair Halo */}
      <circle cx="25" cy="13.5" r="3.2" fill="#78350f" />
      
      {/* Wide Open Raised Arms (Exact Pose from Image 1) */}
      {/* Left arm reaching up-left */}
      <path d="M25 18 C20 16, 14 12, 10 9" stroke="#78350f" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* Right arm reaching up-right */}
      <path d="M25 18 C30 16, 36 12, 40 9" stroke="#78350f" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      
      {/* Open Hands */}
      <circle cx="9.5" cy="8.5" r="1.5" fill="#78350f" />
      <circle cx="40.5" cy="8.5" r="1.5" fill="#78350f" />

      {/* Flowing Red Sash Ribbon (Sash draping from shoulders) */}
      <path d="M14 14 C9 18, 8 26, 13 29" stroke="#b45309" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.85" />
      <path d="M36 14 C41 18, 42 26, 37 29" stroke="#b45309" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.85" />

      {/* Torso & Golden Dhoti */}
      <path d="M22 17 L21 28 C21 28, 25 36, 29 37 C29 37, 27 28, 28 17 Z" fill="#78350f" />
      
      {/* Long Flower Garland (Vanamāla looping down to knees) */}
      <path d="M20 17 C16 25, 20 38, 25 38 C30 38, 34 25, 30 17" stroke="#fff" strokeWidth="1.2" strokeDasharray="1.5 1" fill="none" opacity="0.9" />

      {/* Dancing Legs (Crossed Lotus Dancing Step) */}
      <path d="M23 35 L20 42 M27 35 L29 42" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
);


// 🔵 2. LORD NITYANANDA PRABHU EMBOSSED BLUE COIN
// Inspired by Image 2: Lord Nityananda pointing right finger, holding stick in left hand, turban, blue dhoti
export const NityanandCoinIcon = ({ size = 32, style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 50 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 3px 8px rgba(59,130,246,0.6))', cursor: 'pointer', ...style }}
  >
    <defs>
      {/* Metallic Blue Gradient */}
      <radialGradient id="blueCoinBase" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#eff6ff" />
        <stop offset="30%" stopColor="#93c5fd" />
        <stop offset="60%" stopColor="#3b82f6" />
        <stop offset="85%" stopColor="#1d4ed8" />
        <stop offset="100%" stopColor="#1e3a8a" />
      </radialGradient>

      {/* 3D Bevel */}
      <linearGradient id="blueBevel" x1="0" y1="0" x2="50" y2="50">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#172554" stopOpacity="0.9" />
      </linearGradient>

      <filter id="blueEmbossShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="1" dy="1.5" stdDeviation="0.8" floodColor="#1e3a8a" floodOpacity="0.8" />
      </filter>
    </defs>

    {/* Outer 3D Blue Coin Edge */}
    <circle cx="25" cy="25" r="23.5" fill="url(#blueCoinBase)" stroke="url(#blueBevel)" strokeWidth="2.5" />
    <circle cx="25" cy="25" r="21" fill="none" stroke="#bfdbfe" strokeWidth="0.8" strokeDasharray="1.5 1.5" opacity="0.8" />
    <circle cx="25" cy="25" r="19.5" fill="none" stroke="#1e3a8a" strokeWidth="0.6" opacity="0.4" />

    {/* Embossed Figure Group: Lord Nityananda (Pointing Right Hand + Stick in Left Hand from Image 2) */}
    <g filter="url(#blueEmbossShadow)">
      {/* Turban Head (Turban shape from Image 2) */}
      <path d="M21 11 C21 9, 29 9, 29 11 C29 14, 21 14, 21 11 Z" fill="#1e3a8a" />
      <circle cx="25" cy="11.5" r="1" fill="#fbbf24" /> {/* Turban Jewel */}
      <circle cx="25" cy="14" r="3" fill="#1e3a8a" />

      {/* Right Arm Pointing Forward (Exact Pose from Image 2) */}
      <path d="M24 18 L15 15 L10 14" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="9.5" cy="14" r="1" fill="#1e3a8a" /> {/* Pointing Finger */}

      {/* Left Arm Holding Herding Stick / Staff Raised (Exact Pose from Image 2) */}
      <path d="M26 18 L34 16 L38 10" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" fill="none" />
      
      {/* Walking / Herding Stick (Staff) */}
      <path d="M36 4 L42 22" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" fill="none" />

      {/* Torso & Blue Dhoti (Graceful Dancing Stance) */}
      <path d="M22 18 L20 28 C20 28, 25 37, 28 37 C28 37, 28 28, 28 18 Z" fill="#1e3a8a" />

      {/* Flower Garland */}
      <path d="M22 18 C20 25, 23 34, 25 34 C27 34, 29 25, 28 18" stroke="#fff" strokeWidth="1" strokeDasharray="1.2 1" fill="none" opacity="0.9" />

      {/* Feet */}
      <path d="M22 36 L21 42 M27 36 L28 42" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
);


// ⚡ 3. SRILA PRABHUPADA EMBOSSED SAFFRON COIN
// Inspired by Image 3: Srila Prabhupada Morning Walk posture with Walking Stick & Saffron Robe
export const PrabhupadaCoinIcon = ({ size = 32, style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 50 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 3px 8px rgba(234,88,12,0.6))', cursor: 'pointer', ...style }}
  >
    <defs>
      {/* Metallic Saffron / Bronze Gradient */}
      <radialGradient id="saffronCoinBase" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#fff7ed" />
        <stop offset="30%" stopColor="#ffedd5" />
        <stop offset="60%" stopColor="#f97316" />
        <stop offset="85%" stopColor="#ea580c" />
        <stop offset="100%" stopColor="#7c2d12" />
      </radialGradient>

      {/* 3D Bevel */}
      <linearGradient id="saffronBevel" x1="0" y1="0" x2="50" y2="50">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="50%" stopColor="#ea580c" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#431407" stopOpacity="0.9" />
      </linearGradient>

      <filter id="saffronEmbossShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="1" dy="1.5" stdDeviation="0.8" floodColor="#7c2d12" floodOpacity="0.8" />
      </filter>
    </defs>

    {/* Outer 3D Saffron Coin Edge */}
    <circle cx="25" cy="25" r="23.5" fill="url(#saffronCoinBase)" stroke="url(#saffronBevel)" strokeWidth="2.5" />
    <circle cx="25" cy="25" r="21" fill="none" stroke="#ffedd5" strokeWidth="0.8" strokeDasharray="1.5 1.5" opacity="0.8" />
    <circle cx="25" cy="25" r="19.5" fill="none" stroke="#7c2d12" strokeWidth="0.6" opacity="0.4" />

    {/* Embossed Figure Group: Srila Prabhupada Morning Walk Posture (Exact Pose from Image 3) */}
    <g filter="url(#saffronEmbossShadow)">
      {/* Head Profile & Shaved Head Silhouette */}
      <circle cx="26" cy="11" r="3.6" fill="#7c2d12" />
      
      {/* Tilak */}
      <path d="M27.5 9 L27.5 11" stroke="#ffedd5" strokeWidth="0.8" strokeLinecap="round" />

      {/* Walking Cane / Stick in Hand (Exact Pose from Image 3) */}
      <path d="M23 20 L15 42" stroke="#431407" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M22 18 C20 18, 18 20, 20 22" stroke="#431407" strokeWidth="1.8" strokeLinecap="round" fill="none" /> {/* Cane Handle */}

      {/* Saffron Kurta & Flowing Robe (Upper & Lower Body from Image 3) */}
      <path d="M24 15 L20 27 L28 35 L33 37 L31 25 L28 15 Z" fill="#7c2d12" />
      
      {/* Neck Japa Mala Bag hanging from shoulder */}
      <path d="M26 15 C27 20, 30 23, 29 25" stroke="#ffedd5" strokeWidth="1.5" fill="none" />
      <rect x="27.5" y="24" width="3.5" height="4.5" rx="1" fill="#ffedd5" />

      {/* Walking Strided Legs & Shoes (Exact Walking Stride from Image 3) */}
      {/* Front walking leg extending forward */}
      <path d="M27 34 L36 41" stroke="#7c2d12" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="37.5" cy="42" rx="2.5" ry="1" fill="#ffedd5" /> {/* White Shoe */}

      {/* Rear leg behind */}
      <path d="M24 34 L20 40" stroke="#7c2d12" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <ellipse cx="19" cy="40.5" rx="2" ry="1" fill="#ffedd5" opacity="0.8" />
    </g>
  </svg>
);
