// ─── Utility functions ───────────────────────────────────────────────

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const startRad = ((startAngle - 90) * Math.PI) / 180;
  const endRad = ((endAngle - 90) * Math.PI) / 180;

  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);

  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

// ─── BarChart ────────────────────────────────────────────────────────

interface BarChartProps {
  data: { label: string; value: number; target?: number }[];
  width?: number;
  height?: number;
  barColor?: string;
  targetColor?: string;
}

export function BarChart({
  data,
  width = 500,
  height = 260,
  barColor = "#3b82f6",
  targetColor = "#ef4444",
}: BarChartProps) {
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allValues = data.flatMap((d) => [d.value, d.target ?? 0]);
  const maxVal = Math.max(...allValues) * 1.15;
  const barWidth = (chartW / data.length) * 0.6;
  const gap = (chartW / data.length) * 0.4;

  const gridLines = 5;
  const gridStep = maxVal / gridLines;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {/* Gridlines */}
      {Array.from({ length: gridLines + 1 }, (_, i) => {
        const y = padding.top + chartH - (i * chartH) / gridLines;
        const val = Math.round(i * gridStep);
        return (
          <g key={`grid-${i}`}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth={1}
            />
            <text
              x={padding.left - 8}
              y={y + 4}
              textAnchor="end"
              fontSize={10}
              fill="#9ca3af"
            >
              {formatCurrency(val)}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const x = padding.left + i * (barWidth + gap) + gap / 2;
        const barH = (d.value / maxVal) * chartH;
        const y = padding.top + chartH - barH;

        return (
          <g key={`bar-${i}`}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx={3}
              fill={barColor}
            />
            {d.target !== undefined && (
              <line
                x1={x - 4}
                y1={padding.top + chartH - (d.target / maxVal) * chartH}
                x2={x + barWidth + 4}
                y2={padding.top + chartH - (d.target / maxVal) * chartH}
                stroke={targetColor}
                strokeWidth={2}
                strokeDasharray="4 2"
              />
            )}
            <text
              x={x + barWidth / 2}
              y={height - padding.bottom + 16}
              textAnchor="middle"
              fontSize={10}
              fill="#6b7280"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── PieChart ────────────────────────────────────────────────────────

interface PieSlice {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  slices: PieSlice[];
  size?: number;
  innerRadius?: number;
  centerLabel?: string;
}

export function PieChart({
  slices,
  size = 200,
  innerRadius = 50,
  centerLabel,
}: PieChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 10;
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  let currentAngle = 0;
  const arcs = slices.map((slice) => {
    const sliceAngle = (slice.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    // For a full circle, handle the edge case
    const adjustedEnd = sliceAngle >= 360 ? endAngle - 0.01 : endAngle;

    const outerPath = describeArc(cx, cy, outerR, startAngle, adjustedEnd);
    const innerPath = describeArc(cx, cy, innerRadius, adjustedEnd, startAngle);

    const endRadOuter = ((adjustedEnd - 90) * Math.PI) / 180;
    const startRadInner = ((startAngle - 90) * Math.PI) / 180;

    const outerEndX = cx + outerR * Math.cos(endRadOuter);
    const outerEndY = cy + outerR * Math.sin(endRadOuter);
    const innerStartX = cx + innerRadius * Math.cos(endRadOuter);
    const innerStartY = cy + innerRadius * Math.sin(endRadOuter);
    const innerEndX = cx + innerRadius * Math.cos(startRadInner);
    const innerEndY = cy + innerRadius * Math.sin(startRadInner);

    const d = `${outerPath} L ${innerStartX} ${innerStartY} ${innerPath} Z`;

    return { ...slice, d, sliceAngle };
  });

  return (
    <div className="flex items-center gap-4">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="shrink-0"
      >
        {arcs.map((arc, i) => (
          <path key={i} d={arc.d} fill={arc.color} />
        ))}
        {centerLabel && (
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={14}
            fontWeight="bold"
            fill="#374151"
          >
            {centerLabel}
          </text>
        )}
      </svg>

      {/* Legend */}
      <div className="flex flex-col gap-1.5">
        {slices.map((slice, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-gray-600">{slice.label}</span>
            <span className="font-medium text-gray-900 ml-auto tabular-nums">
              {formatPercent(slice.value / total)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SparkLine ───────────────────────────────────────────────────────

interface SparkLineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  labels?: string[];
}

export function SparkLine({
  data,
  width = 400,
  height = 120,
  strokeColor = "#8b5cf6",
  fillColor = "#8b5cf620",
  labels,
}: SparkLineProps) {
  const padding = { top: 10, right: 10, bottom: labels ? 24 : 10, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartW;
    const y = padding.top + chartH - ((val - min) / range) * chartH;
    return `${x},${y}`;
  });

  const polylinePoints = points.join(" ");

  const fillPoints = [
    `${padding.left},${padding.top + chartH}`,
    ...points,
    `${padding.left + chartW},${padding.top + chartH}`,
  ].join(" ");

  const gradientId = `spark-gradient-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#${gradientId})`} />
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Min/Max dots */}
      {data.map((val, i) => {
        if (val !== min && val !== max) return null;
        const x = padding.left + (i / (data.length - 1)) * chartW;
        const y = padding.top + chartH - ((val - min) / range) * chartH;
        return (
          <circle key={i} cx={x} cy={y} r={3} fill={strokeColor} />
        );
      })}
      {/* Labels */}
      {labels?.map((label, i) => {
        const x = padding.left + (i / (labels.length - 1)) * chartW;
        return (
          <text
            key={i}
            x={x}
            y={height - 4}
            textAnchor="middle"
            fontSize={9}
            fill="#9ca3af"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── HorizontalBar ──────────────────────────────────────────────────

interface HorizontalBarProps {
  data: { label: string; value: number; color: string }[];
  width?: number;
  barHeight?: number;
}

export function HorizontalBar({
  data,
  width = 400,
  barHeight = 28,
}: HorizontalBarProps) {
  const maxVal = Math.max(...data.map((d) => d.value));
  const height = data.length * (barHeight + 12) + 10;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {data.map((d, i) => {
        const y = i * (barHeight + 12) + 6;
        const barW = (d.value / maxVal) * (width - 120);
        return (
          <g key={i}>
            <text
              x={0}
              y={y + barHeight / 2 + 4}
              fontSize={11}
              fill="#6b7280"
            >
              {d.label}
            </text>
            <rect
              x={70}
              y={y}
              width={barW}
              height={barHeight}
              rx={4}
              fill={d.color}
            />
            <text
              x={70 + barW + 8}
              y={y + barHeight / 2 + 4}
              fontSize={11}
              fontWeight="600"
              fill="#374151"
            >
              {formatCurrency(d.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── MiniDonut ──────────────────────────────────────────────────────

interface MiniDonutProps {
  value: number;
  total: number;
  color: string;
  size?: number;
  label?: string;
}

export function MiniDonut({
  value,
  total,
  color,
  size = 80,
  label,
}: MiniDonutProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;
  const innerR = r - 8;
  const pct = value / total;
  const angle = pct * 360;

  const outerArc = describeArc(cx, cy, r, 0, Math.min(angle, 359.99));
  const endRad = ((Math.min(angle, 359.99) - 90) * Math.PI) / 180;
  const startRad = ((0 - 90) * Math.PI) / 180;

  const innerArcEnd = describeArc(cx, cy, innerR, Math.min(angle, 359.99), 0);
  const innerEndX = cx + innerR * Math.cos(endRad);
  const innerEndY = cy + innerR * Math.sin(endRad);

  const d = `${outerArc} L ${innerEndX} ${innerEndY} ${innerArcEnd} Z`;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        {/* Background ring */}
        <circle cx={cx} cy={cy} r={r - 4} fill="none" stroke="#e5e7eb" strokeWidth={8} />
        {/* Value arc */}
        <path d={d} fill={color} />
        {/* Center text */}
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={14}
          fontWeight="bold"
          fill="#374151"
        >
          {formatPercent(pct)}
        </text>
      </svg>
      {label && (
        <span className="text-xs font-medium text-gray-600">{label}</span>
      )}
    </div>
  );
}
