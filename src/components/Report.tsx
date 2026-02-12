import {
  HorizontalBar,
  MiniDonut,
  formatCurrency,
  formatPercent,
} from "./charts.tsx";

// ─── Data ────────────────────────────────────────────────────────────

const quarterlyRevenue = [
  { label: "Oct", value: 2720000, color: "#3b82f6" },
  { label: "Nov", value: 2900000, color: "#6366f1" },
  { label: "Dec", value: 3120000, color: "#8b5cf6" },
];

const regions = [
  { name: "North America", value: 5240000, total: 8740000, color: "#3b82f6" },
  { name: "EMEA", value: 2180000, total: 8740000, color: "#8b5cf6" },
  { name: "APAC", value: 1320000, total: 8740000, color: "#06b6d4" },
];

const metrics = [
  { label: "Net Revenue", current: 8740000, previous: 7820000 },
  { label: "Gross Margin", current: 0.682, previous: 0.654 },
  { label: "Customer Acquisition Cost", current: 342, previous: 389 },
  { label: "LTV:CAC Ratio", current: 4.8, previous: 4.2 },
  { label: "Monthly Recurring Revenue", current: 2910000, previous: 2540000 },
  { label: "Churn Rate", current: 0.024, previous: 0.031 },
];

// ─── Helpers ─────────────────────────────────────────────────────────

function formatMetricValue(label: string, value: number): string {
  if (label.includes("Margin") || label.includes("Rate")) return formatPercent(value);
  if (label.includes("Ratio")) return value.toFixed(1) + "x";
  return formatCurrency(value);
}

function TrendArrow({ positive }: { positive: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className="inline-block">
      {positive ? (
        <polygon points="7,2 12,9 2,9" fill="#16a34a" />
      ) : (
        <polygon points="7,12 12,5 2,5" fill="#dc2626" />
      )}
    </svg>
  );
}

function isImprovementPositive(label: string, change: number): boolean {
  // For cost and churn, a decrease is good
  if (label.includes("Cost") || label.includes("Churn")) return change < 0;
  return change > 0;
}

// ─── Report ──────────────────────────────────────────────────────────

export default function Report() {
  const totalRevenue = quarterlyRevenue.reduce((sum, m) => sum + m.value, 0);

  return (
    <div className="max-w-3xl mx-auto font-sans">
      {/* ── Title Page ── */}
      <div className="bg-slate-900 text-white px-10 py-16 rounded-t-lg">
        {/* Geometric logo */}
        <svg width="48" height="48" viewBox="0 0 48 48" className="mb-8">
          <rect x="4" y="4" width="18" height="18" rx="3" fill="#3b82f6" />
          <rect x="26" y="4" width="18" height="18" rx="3" fill="#8b5cf6" opacity="0.8" />
          <rect x="4" y="26" width="18" height="18" rx="3" fill="#06b6d4" opacity="0.6" />
          <rect x="26" y="26" width="18" height="18" rx="3" fill="#3b82f6" opacity="0.4" />
        </svg>
        <h1 className="text-3xl font-bold tracking-tight">
          Quarterly Business Report
        </h1>
        <p className="mt-2 text-lg text-slate-300">Q4 2025 &middot; October&ndash;December</p>
        <p className="mt-1 text-sm text-slate-400">Prepared by Finance &amp; Analytics</p>
      </div>

      <div className="bg-white px-10 py-8 space-y-10">
        {/* ── Executive Summary ── */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">
            Executive Summary
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            Q4 2025 delivered strong results with total net revenue of{" "}
            <strong className="text-gray-900">{formatCurrency(totalRevenue)}</strong>,
            representing a <strong className="text-gray-900">11.8%</strong> increase
            over the prior quarter. Growth was driven primarily by enterprise segment
            expansion in North America and accelerating adoption in the APAC region.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            Gross margin improved to <strong className="text-gray-900">68.2%</strong>{" "}
            (up from 65.4%), reflecting operational efficiencies from the infrastructure
            migration completed in September. Customer acquisition costs decreased by{" "}
            <strong className="text-gray-900">12.1%</strong>, while lifetime value
            continued its upward trajectory.
          </p>
          <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 rounded-r-lg">
            <p className="text-sm font-medium text-blue-900 italic">
              &ldquo;The strongest quarter in company history, with all three regions
              exceeding plan for the first time.&rdquo;
            </p>
          </blockquote>
        </section>

        {/* ── Revenue Overview ── */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">
            Revenue Overview
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Monthly revenue trended upward throughout the quarter, with December
            posting a record <strong className="text-gray-900">{formatCurrency(3120000)}</strong>.
          </p>
          <HorizontalBar data={quarterlyRevenue} width={500} barHeight={32} />
        </section>

        {/* ── Regional Breakdown ── */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">
            Regional Breakdown
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Revenue contribution by region for Q4 2025.
          </p>
          <div className="flex justify-around">
            {regions.map((region, i) => (
              <MiniDonut
                key={i}
                value={region.value}
                total={region.total}
                color={region.color}
                size={90}
                label={region.name}
              />
            ))}
          </div>
          <div className="mt-4 flex justify-around text-center">
            {regions.map((region, i) => (
              <p key={i} className="text-xs text-gray-500 tabular-nums">
                {formatCurrency(region.value)}
              </p>
            ))}
          </div>
        </section>

        {/* ── Key Metrics Table ── */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">
            Key Metrics
          </h2>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-2.5 px-4 font-semibold text-gray-600">Metric</th>
                  <th className="text-right py-2.5 px-4 font-semibold text-gray-600">Q4 2025</th>
                  <th className="text-right py-2.5 px-4 font-semibold text-gray-600">Q3 2025</th>
                  <th className="text-right py-2.5 px-4 font-semibold text-gray-600">Change</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m, i) => {
                  const change = (m.current - m.previous) / Math.abs(m.previous);
                  const isPositive = isImprovementPositive(m.label, change);
                  return (
                    <tr
                      key={i}
                      className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                    >
                      <td className="py-2.5 px-4 font-medium text-gray-900">{m.label}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums text-gray-900">
                        {formatMetricValue(m.label, m.current)}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums text-gray-500">
                        {formatMetricValue(m.label, m.previous)}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1">
                          <TrendArrow positive={isPositive} />
                          <span
                            className={`text-xs font-medium px-1.5 py-0.5 rounded tabular-nums ${
                              isPositive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {change >= 0 ? "+" : ""}
                            {formatPercent(change)}
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Outlook ── */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">
            Outlook &amp; Priorities for Q1 2026
          </h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-2">
              <span className="text-blue-500 font-bold">&bull;</span>
              <span>
                <strong>Enterprise expansion:</strong> Target 15% growth in enterprise
                ARR through strategic account development and upsell motions.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500 font-bold">&bull;</span>
              <span>
                <strong>APAC investment:</strong> Expand regional team by 40% to
                capitalize on growing demand in Japan and Australia.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500 font-bold">&bull;</span>
              <span>
                <strong>Product-led growth:</strong> Launch self-serve tier to reduce
                CAC for the starter segment by an estimated 25%.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500 font-bold">&bull;</span>
              <span>
                <strong>Retention:</strong> Reduce monthly churn below 2.0% through
                proactive health scoring and dedicated CSM engagement.
              </span>
            </li>
          </ul>
        </section>
      </div>

      {/* ── Footer ── */}
      <div className="bg-gray-50 px-10 py-4 rounded-b-lg border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400">
          Confidential &mdash; For internal use only &middot; Generated{" "}
          {new Date(2025, 11, 31).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}
