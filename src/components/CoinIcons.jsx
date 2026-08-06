import React from 'react';

// 🥇 Lord Chaitanya Mahaprabhu Figure (Ecstatic Dancing Posture with Arms Raised)
export const ChaitanyaCoinIcon = ({ size = 24, style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 2px 6px rgba(251,191,36,0.5))', ...style }}
  >
    {/* Outer Medallion Halo */}
    <circle cx="20" cy="20" r="19" fill="url(#chaitanyaGoldGrad)" stroke="#fef08a" strokeWidth="1.5" />
    
    {/* Rays of Mahaprabhu */}
    <path d="M20 2L20 6M20 34L20 38M2 20L6 20M34 20L38 20M7 7L10 10M30 30L33 33M33 7L30 10M7 33L10 30" stroke="#fef9c3" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    
    {/* Lord Chaitanya Silhouette (Dancing Arms Raised in Sankirtan) */}
    {/* Head Halo */}
    <circle cx="20" cy="11" r="3.5" fill="#ffffff" />
    <circle cx="20" cy="11" r="4.5" stroke="#fef08a" strokeWidth="0.8" fill="none" opacity="0.8" />

    {/* Raised Arms (Ecstatic Harinam Stance) */}
    <path d="M14 8C14 8 16 13 18 14M26 8C26 8 24 13 22 14" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    {/* Hands Up */}
    <circle cx="13.5" cy="7.5" r="1.2" fill="#ffffff" />
    <circle cx="26.5" cy="7.5" r="1.2" fill="#ffffff" />

    {/* Torso & Dhoti */}
    <path d="M18 14L16 23C16 23 18 28 20 28C22 28 24 23 24 23L22 14Z" fill="#ffffff" />
    {/* Dancing Feet */}
    <path d="M18 28L16.5 33M22 28L23.5 33" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />

    {/* Gradient Def */}
    <defs>
      <linearGradient id="chaitanyaGoldGrad" x1="0" y1="0" x2="40" y2="40">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="50%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>
  </svg>
);

// 🔵 Lord Nityananda Prabhu Figure (Merciful Blessing Posture with Lotus Halo)
export const NityanandCoinIcon = ({ size = 24, style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 2px 6px rgba(59,130,246,0.5))', ...style }}
  >
    {/* Outer Medallion Halo */}
    <circle cx="20" cy="20" r="19" fill="url(#nityanandBlueGrad)" stroke="#bfdbfe" strokeWidth="1.5" />
    
    {/* Lotus Petals Base */}
    <path d="M12 31C16 28 24 28 28 31C25 34 15 34 12 31Z" fill="#93c5fd" opacity="0.8" />
    
    {/* Lord Nityananda Silhouette (Blessing Posture) */}
    {/* Head & Tilak Halo */}
    <circle cx="20" cy="11.5" r="3.5" fill="#ffffff" />
    <path d="M20 7L20 9.5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />

    {/* Blessing Right Arm & Open Left Arm */}
    <path d="M15 14C15 14 17 12 17 9.5M25 14C25 14 23 17 21 16" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />

    {/* Torso & Divine Robe */}
    <path d="M17 14.5L15.5 24C15.5 24 20 27 24.5 24L23 14.5Z" fill="#ffffff" />
    {/* Standing Stance */}
    <path d="M18 24L17.5 29.5M22 24L22.5 29.5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />

    {/* Gradient Def */}
    <defs>
      <linearGradient id="nityanandBlueGrad" x1="0" y1="0" x2="40" y2="40">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="50%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
  </svg>
);

// ⚡ Srila Prabhupada Figure (Seated Founder-Acharya Figure in Japa/Meditation with Tilak)
export const PrabhupadaCoinIcon = ({ size = 24, style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 2px 6px rgba(234,88,12,0.5))', ...style }}
  >
    {/* Outer Saffron Medallion */}
    <circle cx="20" cy="20" r="19" fill="url(#prabhupadaSaffronGrad)" stroke="#ffedd5" strokeWidth="1.5" />
    
    {/* Sacred Flame Halo */}
    <circle cx="20" cy="12" r="7" fill="rgba(255,255,255,0.15)" stroke="#ffedd5" strokeWidth="0.8" strokeDasharray="2 2" />

    {/* Srila Prabhupada Seated Silhouette (Vyāsāsana Japa/Teaching Posture) */}
    {/* Head & Sacred Tilak */}
    <circle cx="20" cy="11" r="3.8" fill="#ffffff" />
    {/* Urdhva Pundra Tilak Symbol */}
    <path d="M20 7.5V10.5M19 8.5H21" stroke="#ea580c" strokeWidth="0.8" strokeLinecap="round" />

    {/* Seated Upper Body & Saffron Chaddar */}
    <path d="M13 20C13 15 27 15 27 20L28 27C28 29 12 29 12 27Z" fill="#ffffff" />
    
    {/* Japa Mala Bag in Right Hand */}
    <path d="M22 17C23.5 17 25 18.5 24 20" stroke="#ffedd5" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="24.5" cy="20.5" r="1.5" fill="#ffedd5" />

    {/* Seated Asana Base */}
    <path d="M10 27.5C10 27.5 20 29.5 30 27.5L29 31.5H11L10 27.5Z" fill="#ffedd5" opacity="0.9" />

    {/* Gradient Def */}
    <defs>
      <linearGradient id="prabhupadaSaffronGrad" x1="0" y1="0" x2="40" y2="40">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="50%" stopColor="#ea580c" />
        <stop offset="100%" stopColor="#c2410c" />
      </linearGradient>
    </defs>
  </svg>
);
