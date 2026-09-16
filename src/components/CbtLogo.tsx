import React from 'react';

interface CbtLogoProps {
  className?: string;
}

export const CbtLogo: React.FC<CbtLogoProps> = ({ className = 'w-28 h-28' }) => {
  return (
    <div className={`relative inline-block ${className} shrink-0`}>
      <svg
        viewBox="0 0 500 500"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xl"
      >
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="deskGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#c2410c" />
          </linearGradient>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Outer Rounded Square Badge */}
        <rect x="15" y="15" width="470" height="470" rx="64" fill="url(#bgGrad)" stroke="#60a5fa" strokeWidth="10" filter="url(#shadow)" />
        <rect x="28" y="28" width="444" height="444" rx="52" fill="none" stroke="#3b82f6" strokeWidth="4" opacity="0.6" />

        {/* Background Decorative Canvas Card */}
        <rect x="50" y="70" width="400" height="300" rx="36" fill="#e0f2fe" opacity="0.95" />
        <path d="M 50 200 L 450 200 L 450 334 C 450 354 434 370 414 370 L 86 370 C 66 370 50 354 50 334 Z" fill="#bae6fd" opacity="0.5" />

        {/* Top Left: School Badge Icon */}
        <rect x="68" y="86" width="56" height="56" rx="14" fill="#1e3a8a" />
        <path d="M 96 98 L 112 110 L 80 110 Z" fill="#ffffff" />
        <rect x="83" y="110" width="26" height="20" fill="#ffffff" />
        <rect x="91" y="118" width="10" height="12" fill="#1e3a8a" />
        <circle cx="96" cy="106" r="3" fill="#1e3a8a" />

        {/* Top Right: Clock Icon */}
        <circle cx="410" cy="112" r="22" fill="#ffffff" stroke="#0284c7" strokeWidth="4" />
        <path d="M 410 100 L 410 112 L 420 112" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Giant Phone Screen on Right side */}
        <rect x="250" y="105" width="160" height="250" rx="24" fill="#0f172a" stroke="#38bdf8" strokeWidth="4" />
        <rect x="260" y="120" width="140" height="220" rx="16" fill="#f8fafc" />
        {/* Phone Screen Notch */}
        <rect x="300" y="110" width="60" height="6" rx="3" fill="#334155" />
        {/* Question info on phone */}
        <text x="270" y="142" fontFamily="sans-serif" fontSize="12" fontWeight="800" fill="#0284c7">Q 24/60</text>
        <text x="345" y="142" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill="#64748b">⏱ 0:14:32</text>
        <line x1="270" y1="150" x2="390" y2="150" stroke="#e2e8f0" strokeWidth="2" />

        {/* Option bubbles on phone */}
        <g transform="translate(270, 160)">
          <circle cx="14" cy="12" r="10" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" />
          <text x="14" y="16" textAnchor="middle" fontFamily="sans-serif" fontSize="11" fontWeight="800" fill="#0369a1">A</text>
          <rect x="32" y="7" width="70" height="10" rx="5" fill="#cbd5e1" />

          <circle cx="14" cy="38" r="10" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" />
          <text x="14" y="42" textAnchor="middle" fontFamily="sans-serif" fontSize="11" fontWeight="800" fill="#0369a1">B</text>
          <rect x="32" y="33" width="70" height="10" rx="5" fill="#cbd5e1" />

          <circle cx="14" cy="64" r="10" fill="#10b981" />
          <text x="14" y="68" textAnchor="middle" fontFamily="sans-serif" fontSize="11" fontWeight="800" fill="#ffffff">C</text>
          <rect x="32" y="59" width="70" height="10" rx="5" fill="#10b981" />
          <circle cx="112" cy="64" r="8" fill="#10b981" />
          <path d="M 108 64 L 111 67 L 116 61" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" />

          <circle cx="14" cy="90" r="10" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" />
          <text x="14" y="94" textAnchor="middle" fontFamily="sans-serif" fontSize="11" fontWeight="800" fill="#0369a1">D</text>
          <rect x="32" y="85" width="70" height="10" rx="5" fill="#cbd5e1" />
        </g>

        {/* Student Character at Desk */}
        {/* Chair */}
        <rect x="110" y="240" width="40" height="90" rx="8" fill="#ea580c" />
        <rect x="115" y="310" width="8" height="50" fill="#78350f" />
        <rect x="137" y="310" width="8" height="50" fill="#78350f" />

        {/* Pants */}
        <path d="M 140 280 L 200 280 L 200 360 L 175 360 L 175 310 L 155 310 L 155 360 L 130 360 Z" fill="#1e3a8a" />
        {/* White Shirt */}
        <path d="M 140 200 Q 170 190 200 200 L 210 280 L 135 280 Z" fill="#ffffff" />
        {/* Tie */}
        <path d="M 170 200 L 176 200 L 178 245 L 173 252 L 168 245 Z" fill="#1e3a8a" />
        {/* Collar */}
        <path d="M 158 198 L 173 208 L 163 212 Z" fill="#e2e8f0" />
        <path d="M 188 198 L 173 208 L 183 212 Z" fill="#e2e8f0" />

        {/* Arms holding phone */}
        <path d="M 142 215 Q 180 230 220 225" stroke="#fca5a5" strokeWidth="16" strokeLinecap="round" fill="none" />
        <path d="M 190 220 Q 215 235 235 225" stroke="#fca5a5" strokeWidth="14" strokeLinecap="round" fill="none" />

        {/* Phone held in hand */}
        <rect x="220" y="200" width="30" height="50" rx="6" fill="#0f172a" transform="rotate(-10 235 225)" />
        <rect x="223" y="205" width="24" height="40" rx="4" fill="#38bdf8" transform="rotate(-10 235 225)" />

        {/* Head */}
        <circle cx="172" cy="160" r="22" fill="#fca5a5" />
        {/* Hair */}
        <path d="M 148 158 C 148 135 160 130 178 130 C 196 130 200 145 198 160 C 192 145 180 142 168 148 C 158 152 152 155 148 158 Z" fill="#1e293b" />
        {/* Ear */}
        <circle cx="152" cy="162" r="5" fill="#fca5a5" />
        {/* Eye & Smile */}
        <circle cx="180" cy="158" r="2.5" fill="#0f172a" />
        <path d="M 176 168 Q 182 174 187 168" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Wooden Desk in Front */}
        <rect x="170" y="260" width="160" height="18" rx="4" fill="url(#deskGrad)" />
        <rect x="180" y="278" width="14" height="82" fill="#9a3412" />
        <rect x="306" y="278" width="14" height="82" fill="#9a3412" />
        {/* Paper & Pencil on Desk */}
        <rect x="200" y="248" width="45" height="14" fill="#ffffff" rx="2" transform="rotate(-4 220 255)" />
        <line x1="205" y1="252" x2="235" y2="250" stroke="#94a3b8" strokeWidth="2" />
        <line x1="205" y1="256" x2="230" y2="254" stroke="#94a3b8" strokeWidth="2" />
        <rect x="250" y="254" width="25" height="4" fill="#eab308" rx="1" transform="rotate(5 260 255)" />

        {/* Bottom Branding Banner */}
        <rect x="35" y="380" width="430" height="90" rx="24" fill="#0a192f" />
        <text x="250" y="426" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontSize="38" fontWeight="900" fill="#ffffff" letterSpacing="1">CBT_GURUAI</text>
        <text x="250" y="454" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontSize="16" fontWeight="800" fill="#60a5fa" letterSpacing="3">APLIKASI UJIAN SISWA</text>
      </svg>
    </div>
  );
};
