import React from 'react';

// ... (Ikon yang sudah ada)

// Ikon yang sudah ada di file Anda...

export const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
    </svg>
);

export const TrendIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
);

export const SupportResistanceIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.97 2.122L7.03 22.5l-1.06-1.06a3 3 0 0 1-2.122-.97V17.25m6 0v1.007a3 3 0 0 0 .97 2.122l1.06 1.06-1.06 1.06a3 3 0 0 0-2.122.97V17.25m6 0v1.007a3 3 0 0 1-.97 2.122l-1.06 1.06 1.06 1.06a3 3 0 0 1 2.122.97V17.25M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

export const CandlestickIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8-3 1 3m0 0-1 3m-6-3-1 3m1-3-1-3m5 6h-4m1-3-1 3m1-3-1-3" />
    </svg>
);

export const IndicatorIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
    </svg>
);

export const RecommendationIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 12h-2.25m-1.166 5.834L15 16.5m-4.5-1.5-1.591-1.591M6 12H3.75m1.166-5.834L6 7.5m4.5-1.5 1.591 1.591" />
    </svg>
);

export const LoadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

export const LogoutIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
);

export const ThumbsUpIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "w-6 h-6"} viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.3,10.2H16V4.5c0-1.4-1.1-2.5-2.5-2.5h-0.2c-0.8,0-1.6,0.4-2,1.1l-1.8,3.3C9,7.2,8.3,7.5,7.5,7.5H3 c-1.1,0-2,0.9-2,2v9c0,1.1,0.9,2,2,2h15.2c1.7,0,3.1-1.2,3.3-2.8l0.8-6.3C22.5,11,22,10.2,21.3,10.2z" />
    </svg>
);

export const ThumbsDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "w-6 h-6"} viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.7,13.8H8v5.7c0,1.4,1.1,2.5,2.5,2.5h0.2c0.8,0,1.6-0.4,2-1.1l1.8-3.3c0.5-0.8,1.2-1.2,2-1.2h4.5 c1.1,0,2-0.9,2-2v-9c0-1.1-0.9-2-2-2H7.8c-1.7,0-3.1,1.2-3.3,2.8L3.7,11C3.5,12.8,3,13.8,2.7,13.8z" />
    </svg>
);

export const BrainIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 14a3.5 3.5 0 0 0-3.5 3.5v1a3.5 3.5 0 0 0 7 0v-1.8" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 14a3.5 3.5 0 0 1 3.5 3.5v1a3.5 3.5 0 0 1-7 0v-1.8" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.5 16a3.5 3.5 0 0 0 0-7h-1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.5v-3a3.5 3.5 0 0 0-7 0v3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 16a3.5 3.5 0 0 1 0-7h1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.5v3a3.5 3.5 0 0 0 7 0v-3" />
    </svg>
);

export const AdminIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-1.007 1.11-1.227l.268-.108a2.25 2.25 0 0 1 2.56 1.096l.497 1.027a2.25 2.25 0 0 0 2.164 1.488l1.08.068a2.25 2.25 0 0 1 2.003 2.533l-.265 1.06a2.25 2.25 0 0 0 1.258 2.45l.43.215a2.25 2.25 0 0 1 1.096 2.56l-.497 1.027a2.25 2.25 0 0 0-1.488 2.164l-.068 1.08a2.25 2.25 0 0 1-2.533 2.003l-1.06-.265a2.25 2.25 0 0 0-2.45 1.258l-.215.43a2.25 2.25 0 0 1-2.56 1.096l-1.027-.497a2.25 2.25 0 0 0-2.164-1.488l-1.08-.068a2.25 2.25 0 0 1-2.003-2.533l.265-1.06a2.25 2.25 0 0 0-1.258-2.45l-.43-.215a2.25 2.25 0 0 1-1.096-2.56l.497-1.027a2.25 2.25 0 0 0 1.488-2.164l.068-1.08a2.25 2.25 0 0 1 2.533-2.003l1.06.265a2.25 2.25 0 0 0 2.45-1.258l.215-.43a2.25 2.25 0 0 1 1.096-2.56l1.027-.497M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
    </svg>
);

export const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);

// --- TAMBAHAN BARU: Sun Icon (Mode Terang) ---
export const SunIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364-.707-.707M6.343 6.343l-.707-.707m12.728 0-.707.707M6.343 17.657l-.707.707M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
    </svg>
);

// --- TAMBAHAN BARU: Moon Icon (Mode Gelap) ---
export const MoonIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 12.825a9.75 9.75 0 1 0-8.216 8.216c.94-.158 1.879-.321 2.816-.482a4.5 4.5 0 0 0-2.716-4.717 4.5 4.5 0 0 0-4.717-2.716 9.75 9.75 0 0 0 8.216 8.216v-.004Z" />
    </svg>
);