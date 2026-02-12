export default function Invoice() {
  const items = [
    { description: "Website Design", qty: 1, rate: 3000, amount: 3000 },
    { description: "Hosting (12 months)", qty: 12, rate: 25, amount: 300 },
    { description: "Domain Registration", qty: 1, rate: 15, amount: 15 },
  ];

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <div className="max-w-2xl mx-auto p-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">INVOICE</h1>
          <p className="text-sm text-gray-500 mt-1">INV-2025-001</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900">Acme Corp</p>
          <p className="text-sm text-gray-500">123 Main Street</p>
          <p className="text-sm text-gray-500">San Francisco, CA 94102</p>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
          Bill To
        </p>
        <p className="font-medium text-gray-900">Jane Smith</p>
        <p className="text-sm text-gray-600">456 Oak Avenue, Portland, OR 97201</p>
      </div>

      {/* Dates */}
      <div className="flex gap-8 mb-8 text-sm">
        <div>
          <span className="text-gray-500">Date: </span>
          <span className="text-gray-900 font-medium">Jan 15, 2025</span>
        </div>
        <div>
          <span className="text-gray-500">Due: </span>
          <span className="text-gray-900 font-medium">Feb 14, 2025</span>
        </div>
      </div>

      {/* Line Items */}
      <table className="w-full mb-8 text-sm">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left py-2 font-semibold text-gray-600">Description</th>
            <th className="text-right py-2 font-semibold text-gray-600">Qty</th>
            <th className="text-right py-2 font-semibold text-gray-600">Rate</th>
            <th className="text-right py-2 font-semibold text-gray-600">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-3 text-gray-900">{item.description}</td>
              <td className="py-3 text-right text-gray-600">{item.qty}</td>
              <td className="py-3 text-right text-gray-600">
                ${item.rate.toFixed(2)}
              </td>
              <td className="py-3 text-right font-medium text-gray-900">
                ${item.amount.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-1 text-sm text-gray-600">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 text-sm text-gray-600">
            <span>Tax (10%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-t-2 border-gray-900 mt-2 text-lg font-bold text-gray-900">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
        Thank you for your business!
      </div>
    </div>
  );
}
