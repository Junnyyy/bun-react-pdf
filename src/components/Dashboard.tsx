import {
  BarChart,
  PieChart,
  SparkLine,
  formatCurrency,
  formatPercent,
} from "./charts.tsx";

// ─── Data ────────────────────────────────────────────────────────────

const summaryCards = [
  { title: "Revenue", value: 2847500, change: 0.124, prefix: "$" },
  { title: "Customers", value: 18420, change: 0.082, prefix: "" },
  { title: "Avg Order Value", value: 154.6, change: -0.031, prefix: "$" },
  { title: "Conversion Rate", value: 0.0342, change: 0.018, prefix: "" },
] as const;

const monthlyRevenue = [
  { label: "Jan", value: 185000, target: 190000 },
  { label: "Feb", value: 198000, target: 195000 },
  { label: "Mar", value: 215000, target: 200000 },
  { label: "Apr", value: 228000, target: 210000 },
  { label: "May", value: 242000, target: 220000 },
  { label: "Jun", value: 237000, target: 230000 },
  { label: "Jul", value: 255000, target: 240000 },
  { label: "Aug", value: 268000, target: 245000 },
  { label: "Sep", value: 245000, target: 250000 },
  { label: "Oct", value: 272000, target: 255000 },
  { label: "Nov", value: 290000, target: 260000 },
  { label: "Dec", value: 312000, target: 270000 },
];

const productMix = [
  { label: "Enterprise", value: 42, color: "#3b82f6" },
  { label: "Professional", value: 28, color: "#8b5cf6" },
  { label: "Starter", value: 18, color: "#06b6d4" },
  { label: "Free Trial", value: 12, color: "#f59e0b" },
];

const weeklyActivity = [320, 410, 380, 520, 490, 610, 580, 650, 720, 680, 740, 810];
const weekLabels = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"];

const teamData = [
  { name: "Sarah Chen", role: "Enterprise", deals: 24, revenue: 842000, quota: 800000, status: "above" as const },
  { name: "Marcus Johnson", role: "Enterprise", deals: 18, revenue: 756000, quota: 800000, status: "at-risk" as const },
  { name: "Emily Park", role: "Professional", deals: 42, revenue: 628000, quota: 600000, status: "above" as const },
  { name: "David Kim", role: "Professional", deals: 35, revenue: 524000, quota: 600000, status: "below" as const },
  { name: "Ana Silva", role: "Starter", deals: 68, revenue: 412000, quota: 400000, status: "above" as const },
  { name: "James Wright", role: "Starter", deals: 54, revenue: 378000, quota: 400000, status: "at-risk" as const },
];

// ─── Sub-components ──────────────────────────────────────────────────

function TrendArrow({ positive }: { positive: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="inline-block">
      {positive ? (
        <polygon points="8,3 13,10 3,10" fill="#16a34a" />
      ) : (
        <polygon points="8,13 13,6 3,6" fill="#dc2626" />
      )}
    </svg>
  );
}

function SummaryCard({
  title,
  value,
  change,
  prefix,
}: {
  title: string;
  value: number;
  change: number;
  prefix: string;
}) {
  const isPositive = change >= 0;
  const formattedValue =
    prefix === "$"
      ? formatCurrency(value)
      : title === "Conversion Rate"
        ? formatPercent(value)
        : new Intl.NumberFormat("en-US").format(value);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">
        {formattedValue}
      </p>
      <div className="mt-2 flex items-center gap-1">
        <TrendArrow positive={isPositive} />
        <span
          className={`text-sm font-medium tabular-nums ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          {isPositive ? "+" : ""}
          {formatPercent(change)}
        </span>
        <span className="text-sm text-gray-400 ml-1">vs last quarter</span>
      </div>
    </div>
  );
}

const statusStyles = {
  above: { bg: "bg-green-100", text: "text-green-700", label: "Above Target" },
  "at-risk": { bg: "bg-amber-100", text: "text-amber-700", label: "At Risk" },
  below: { bg: "bg-red-100", text: "text-red-700", label: "Below Target" },
} as const;

function PerformanceTable() {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-600">Rep</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-600">Segment</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-600">Deals</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-600">Revenue</th>
            <th className="py-3 px-4 font-semibold text-gray-600">Quota Attainment</th>
            <th className="text-center py-3 px-4 font-semibold text-gray-600">Status</th>
          </tr>
        </thead>
        <tbody>
          {teamData.map((rep, i) => {
            const attainment = rep.revenue / rep.quota;
            const style = statusStyles[rep.status];
            return (
              <tr
                key={i}
                className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
              >
                <td className="py-3 px-4 font-medium text-gray-900">{rep.name}</td>
                <td className="py-3 px-4 text-gray-600">{rep.role}</td>
                <td className="py-3 px-4 text-right tabular-nums text-gray-900">{rep.deals}</td>
                <td className="py-3 px-4 text-right tabular-nums font-medium text-gray-900">
                  {formatCurrency(rep.revenue)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${attainment >= 1 ? "bg-green-500" : attainment >= 0.85 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${Math.min(attainment * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium tabular-nums text-gray-600 w-10 text-right">
                      {formatPercent(attainment)}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
                  >
                    {style.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────

export default function Dashboard() {
  const totalRevenue = teamData.reduce((sum, r) => sum + r.revenue, 0);
  const totalDeals = teamData.reduce((sum, r) => sum + r.deals, 0);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Q4 2025 Performance Overview &middot; {totalDeals} deals &middot;{" "}
            {formatCurrency(totalRevenue)} total revenue
          </p>
        </div>

        {/* Summary Cards — Row 1 */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {summaryCards.map((card, i) => (
            <SummaryCard key={i} {...card} />
          ))}
        </div>

        {/* Charts — Row 2 */}
        <div className="grid grid-cols-12 gap-6 mb-8">
          <div className="col-span-8 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Monthly Revenue vs Target
            </h2>
            <BarChart data={monthlyRevenue} width={600} height={260} />
          </div>
          <div className="col-span-4 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Product Mix
            </h2>
            <PieChart slices={productMix} size={180} centerLabel="Products" />
          </div>
        </div>

        {/* Activity + Table — Row 3 */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Weekly Deal Activity
            </h2>
            <SparkLine
              data={weeklyActivity}
              width={340}
              height={140}
              labels={weekLabels}
            />
          </div>
          <div className="col-span-8 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Team Performance
            </h2>
            <PerformanceTable />
          </div>
        </div>
      </div>
    </div>
  );
}
