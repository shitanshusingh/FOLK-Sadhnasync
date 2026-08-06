import React from 'react';
import chaitanyaImg from '../assets/chaitanya_coin.png';
import nityanandImg from '../assets/nityanand_coin.png';
import prabhupadaImg from '../assets/prabhupada_coin.png';

// 🥇 Real Lord Chaitanya Mahaprabhu Coin (Exact Image 1)
export const ChaitanyaCoinIcon = ({ size = 32, style = {} }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      padding: '2px',
      background: 'linear-gradient(135deg, #fffbeb, #fbbf24, #d97706, #78350f)',
      boxShadow: '0 3px 8px rgba(251,191,36,0.5), inset 0 1px 2px rgba(255,255,255,0.8)',
      display: 'inline-flex',
      alignItems: 'center',
      justify: 'center',
      flexShrink: 0,
      cursor: 'pointer',
      ...style
    }}
  >
    <img
      src={chaitanyaImg}
      alt="Lord Chaitanya Mahaprabhu"
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        objectFit: 'cover',
        objectPosition: 'center top'
      }}
    />
  </div>
);

// 🔵 Real Lord Nityananda Prabhu Coin (Exact Image 2)
export const NityanandCoinIcon = ({ size = 32, style = {} }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      padding: '2px',
      background: 'linear-gradient(135deg, #eff6ff, #60a5fa, #3b82f6, #1e3a8a)',
      boxShadow: '0 3px 8px rgba(59,130,246,0.5), inset 0 1px 2px rgba(255,255,255,0.8)',
      display: 'inline-flex',
      alignItems: 'center',
      justify: 'center',
      flexShrink: 0,
      cursor: 'pointer',
      ...style
    }}
  >
    <img
      src={nityanandImg}
      alt="Lord Nityananda Prabhu"
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        objectFit: 'cover',
        objectPosition: 'center top'
      }}
    />
  </div>
);

// ⚡ Real Srila Prabhupada Coin (Exact Image 3)
export const PrabhupadaCoinIcon = ({ size = 32, style = {} }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      padding: '2px',
      background: 'linear-gradient(135deg, #fff7ed, #f97316, #ea580c, #7c2d12)',
      boxShadow: '0 3px 8px rgba(234,88,12,0.5), inset 0 1px 2px rgba(255,255,255,0.8)',
      display: 'inline-flex',
      alignItems: 'center',
      justify: 'center',
      flexShrink: 0,
      cursor: 'pointer',
      ...style
    }}
  >
    <img
      src={prabhupadaImg}
      alt="Srila Prabhupada"
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        objectFit: 'cover',
        objectPosition: 'center top'
      }}
    />
  </div>
);
