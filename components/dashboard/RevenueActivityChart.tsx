'use client';

import React, { useState } from 'react';
import { formatFCFA } from '@/lib/utils/formatters';
import { useInvoiceStore } from '@/lib/store/invoiceStore';

export default function RevenueActivityChart() {
  const { invoices } = useInvoiceStore();
  const [activePoint, setActivePoint] = useState<number | null>(null);

  const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  
  // Construction des points basée à 100% sur les vraies factures en base
  const chartData = React.useMemo(() => {
    if (!invoices || invoices.length === 0) {
      return daysOfWeek.map((day) => ({ day, amount: 0, invoiceNumber: '' }));
    }
    // Trier par date croissante pour afficher la chronologie réelle
    const sorted = [...invoices].sort(
      (a, b) => new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime()
    );
    const recent = sorted.slice(-7);
    return recent.map((inv) => {
      const d = new Date(inv.issueDate);
      const dayName = !isNaN(d.getTime()) ? daysOfWeek[d.getDay()] : 'Jour';
      return {
        day: `${dayName} ${inv.issueDate.slice(8, 10)}/${inv.issueDate.slice(5, 7)}`,
        amount: inv.amount,
        invoiceNumber: inv.invoiceNumber,
      };
    });
  }, [invoices]);

  // Calculate coordinates for SVG
  const width = 640;
  const height = 220;
  const paddingX = 40;
  const paddingY = 30;

  const maxVal = Math.max(5000000, ...chartData.map((d) => d.amount));
  const points = chartData.map((d, index) => {
    const x = paddingX + (index * (width - 2 * paddingX)) / (chartData.length - 1);
    const y = height - paddingY - (d.amount / maxVal) * (height - 2 * paddingY);
    return { x, y, ...d };
  });

  // Construct smooth Bezier curve
  const pathD = points.reduce((acc, point, i, arr) => {
    if (i === 0) return `M ${point.x},${point.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (point.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (point.x - prev.x) / 2;
    const cp2y = point.y;
    return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${point.x},${point.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`;

  return (
    <div className="bg-[#12131C] rounded-2xl p-5 border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight font-sans">
            Activité de Facturation
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Flux chronologique des factures émises en base de données
          </p>
        </div>

        {/* Legend / Tooltip indicator */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.7)]"></span>
            <span className="text-amber-100/90 font-medium text-[11px]">Émissions (FCFA)</span>
          </div>
        </div>
      </div>

      {/* SVG Line Chart */}
      <div className="relative w-full overflow-hidden pt-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-48 sm:h-52 overflow-visible"
        >
          <defs>
            <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.32" />
              <stop offset="50%" stopColor="#B8860B" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#0B0C10" stopOpacity="0.00" />
            </linearGradient>
            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#D4AF37" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 1.25, 2.5, 3.75, 5].map((level, i) => {
            const y = height - paddingY - (i / 4) * (height - 2 * paddingY);
            return (
              <g key={i}>
                <line
                  x1={paddingX - 10}
                  y1={y}
                  x2={width - paddingX + 10}
                  y2={y}
                  stroke="#262838"
                  strokeWidth="1"
                  strokeDasharray={i === 0 ? "0" : "3 3"}
                  strokeOpacity="0.7"
                />
                <text
                  x={paddingX - 16}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] fill-slate-500 font-mono"
                >
                  {level === 0 ? '0' : `${level}M`}
                </text>
              </g>
            );
          })}

          {/* Area under curve */}
          <path d={areaD} fill="url(#goldGradient)" />

          {/* Smooth Golden Glowing Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#E5C158"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#goldGlow)"
          />

          {/* Data Points */}
          {points.map((p, index) => {
            const isHovered = activePoint === index;
            return (
              <g
                key={p.day}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setActivePoint(index)}
              >
                {/* Hit area for touch/hover */}
                <circle cx={p.x} cy={p.y} r="14" fill="transparent" />

                {/* Animated active indicator */}
                {isHovered && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="9"
                    fill="#D4AF37"
                    fillOpacity="0.25"
                  />
                )}

                {/* Visible dot matching gold aesthetic */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? "5" : "3.5"}
                  fill="#0B0C10"
                  stroke="#E5C158"
                  strokeWidth="2.5"
                  className="transition-all duration-150"
                />

                {/* Day label on bottom X-axis */}
                <text
                  x={p.x}
                  y={height - 6}
                  textAnchor="middle"
                  className={`text-[10px] font-sans transition-colors ${
                    isHovered
                      ? 'fill-[#F5E6B3] font-bold'
                      : 'fill-slate-500 font-medium'
                  }`}
                >
                  {p.day}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Interactive Info Pill */}
        {activePoint !== null && points[activePoint] && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-[#181926] rounded-xl border border-[#D4AF37]/30 shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.7)]"></span>
              <span className="text-xs font-semibold text-white font-mono">
                {points[activePoint].invoiceNumber || points[activePoint].day}
              </span>
              <span className="text-[11px] text-slate-400">
                ({points[activePoint].day})
              </span>
            </div>
            <div className="text-xs font-bold text-[#F5E6B3] font-mono tabular-nums">
              {formatFCFA(points[activePoint].amount)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
