import React, { useState } from 'react';
import {
  GraduationCap,
  Sprout,
  Briefcase,
  Home,
  HeartHandshake,
  ShieldPlus,
  Compass,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const CompassVisual: React.FC = () => {
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const satelliteCards = [
    {
      id: 'edu',
      title: 'Scholarships & Grants',
      badge: 'Education',
      match: '96% Match',
      amount: 'Up to ₹20,000/yr',
      icon: GraduationCap,
      color: 'from-blue-600 to-indigo-600',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
      position: 'top-2 left-2 sm:-top-4 sm:left-4',
      rotate: '-rotate-2',
      link: '/explore?category=Education',
    },
    {
      id: 'agri',
      title: 'PM-KISAN & Subsidies',
      badge: 'Agriculture',
      match: '94% Match',
      amount: '₹6,000/yr DBT',
      icon: Sprout,
      color: 'from-emerald-600 to-teal-700',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      position: 'top-2 right-2 sm:-top-2 sm:right-4',
      rotate: 'rotate-3',
      link: '/explore?category=Agriculture',
    },
    {
      id: 'biz',
      title: 'Mudra & MSME Loans',
      badge: 'Business',
      match: '91% Match',
      amount: 'Collateral-Free ₹20L',
      icon: Briefcase,
      color: 'from-purple-600 to-indigo-700',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
      position: 'bottom-16 left-0 sm:bottom-4 sm:left-6',
      rotate: 'rotate-1',
      link: '/explore?category=Business',
    },
    {
      id: 'housing',
      title: 'Pucca House Subsidy',
      badge: 'Housing',
      match: '88% Match',
      amount: '₹1.30 Lakh Grant',
      icon: Home,
      color: 'from-amber-600 to-orange-600',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      position: 'bottom-2 right-2 sm:-bottom-4 sm:right-6',
      rotate: '-rotate-2',
      link: '/explore?category=Housing',
    },
  ];

  return (
    <div className="relative w-full max-w-xl mx-auto h-[440px] sm:h-[480px] flex items-center justify-center select-none">
      {/* Background Ambient Glow & Grid Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Outer Orbit Ring */}
        <div className="w-[360px] sm:w-[420px] h-[360px] sm:h-[420px] rounded-full border border-teal-200/50 border-dashed animate-spin-slow opacity-60" />
        
        {/* Middle Pulse Ring */}
        <div className="w-[270px] sm:w-[320px] h-[270px] sm:h-[320px] rounded-full border border-emerald-300/40 bg-radial from-teal-100/30 via-transparent to-transparent" />
        
        {/* Radar Sweep Effect */}
        <div className="absolute w-[280px] sm:w-[330px] h-[280px] sm:h-[330px] rounded-full overflow-hidden opacity-30 animate-radar">
          <div className="w-1/2 h-1/2 bg-gradient-to-br from-emerald-400/40 to-transparent origin-bottom-right rounded-tl-full" />
        </div>
      </div>

      {/* Central Compass Instrument */}
      <div className="relative z-10 w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-gradient-to-br from-teal-900 via-teal-950 to-slate-950 p-2 shadow-2xl shadow-teal-950/40 border-4 border-teal-700/60 flex items-center justify-center group">
        {/* Dial Ticks */}
        <div className="absolute inset-2 rounded-full border border-teal-500/30 flex items-center justify-center">
          {/* Cardinal Directions */}
          <span className="absolute top-2 text-[11px] font-extrabold text-emerald-300 tracking-widest">N</span>
          <span className="absolute bottom-2 text-[10px] font-bold text-teal-400/60">S</span>
          <span className="absolute left-2.5 text-[10px] font-bold text-teal-400/60">W</span>
          <span className="absolute right-2.5 text-[10px] font-bold text-teal-400/60">E</span>

          {/* Compass Needle Assembly */}
          <div className="relative w-full h-full flex items-center justify-center group-hover:rotate-45 transition-transform duration-1000 ease-out">
            {/* Compass Diamond Needle */}
            <div className="w-8 sm:w-10 h-28 sm:h-34 relative flex flex-col items-center">
              {/* North Pointer (Emerald / Cyan) */}
              <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-b-[56px] sm:border-b-[68px] border-b-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              {/* South Pointer (Teal / Slate) */}
              <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[56px] sm:border-t-[68px] border-t-teal-700/80" />
            </div>

            {/* Center Pivot Jewel */}
            <div className="absolute w-7 h-7 rounded-full bg-slate-900 border-2 border-emerald-400 shadow-md flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white shadow-xs" />
            </div>
          </div>
        </div>

        {/* Center Badge Floating Label */}
        <div className="absolute -bottom-4 px-3 py-1 rounded-full bg-teal-900/90 backdrop-blur-md border border-teal-500/40 text-[11px] font-bold text-emerald-300 shadow-lg flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-300 animate-pulse" />
          <span>Intelligent Compass</span>
        </div>
      </div>

      {/* Floating Connected Scheme Cards */}
      {satelliteCards.map((card) => {
        const isHovered = activeCard === card.id;
        const Icon = card.icon;

        return (
          <Link
            key={card.id}
            to={card.link}
            onMouseEnter={() => setActiveCard(card.id)}
            onMouseLeave={() => setActiveCard(null)}
            className={`absolute ${card.position} ${card.rotate} z-20 transition-all duration-300 group`}
          >
            <div
              className={`p-3 sm:p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border shadow-lg transition-all duration-300 ${
                isHovered
                  ? 'scale-108 -translate-y-1 shadow-2xl border-teal-500 ring-2 ring-teal-500/20'
                  : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xl'
              } w-44 sm:w-52`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${card.badgeBg}`}>
                  {card.badge}
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded">
                  {card.match}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${card.color} text-white flex items-center justify-center shrink-0 shadow-2xs`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-teal-700 transition-colors">
                    {card.title}
                  </h4>
                  <p className="text-[11px] text-slate-700 font-medium truncate">
                    {card.amount}
                  </p>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all ml-auto shrink-0" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};
