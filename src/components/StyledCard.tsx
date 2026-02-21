import './StyledCard.css'

export default function StyledCard() {
  const stats = [
    { label: "Revenue", value: "$48,250", trend: "+12.5%", up: true },
    { label: "Orders", value: "1,284", trend: "+8.2%", up: true },
    { label: "Refunds", value: "$1,420", trend: "-3.1%", up: false },
  ];

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="card p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Monthly Overview</h2>
          <span className="badge badge--active">Active</span>
        </div>

        <div className="divider" />

        {/* Stats */}
        <div className="flex flex-col gap-5">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value">{stat.value}</p>
              </div>
              <span className={`trend ${stat.up ? "trend--up" : "trend--down"}`}>
                {stat.up ? "\u2191" : "\u2193"} {stat.trend}
              </span>
            </div>
          ))}
        </div>

        <div className="divider" />

        {/* Footer */}
        <p className="text-xs text-center text-gray-400">
          Last updated: Feb 20, 2026
        </p>
      </div>
    </div>
  );
}
