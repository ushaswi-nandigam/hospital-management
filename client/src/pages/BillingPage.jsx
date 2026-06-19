import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/index.js';
import { billingAPI } from '../api/index.js';

export default function BillingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const res = await billingAPI.getPatientBilling(user.id);
        setInvoices(res.data);
      } catch (error) {
        console.error('Failed to load invoices:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBilling();
  }, [user.id]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getTotalAmount = () => {
    return invoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0).toFixed(2);
  };

  const getPendingAmount = () => {
    return invoices
      .filter((inv) => inv.status === 'pending')
      .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0)
      .toFixed(2);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-medical-700 text-white shadow-md">
        <div className="container-custom flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/patient')}
              className="text-white hover:bg-medical-600 px-3 py-2 rounded"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold">Billing & Invoices</h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="container-custom py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="text-gray-600 text-sm font-medium">Total Amount</h3>
            <p className="text-3xl font-bold text-medical-600 mt-2">₹{getTotalAmount()}</p>
          </div>
          <div className="card">
            <h3 className="text-gray-600 text-sm font-medium">Pending Payment</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">₹{getPendingAmount()}</p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Invoice History</h2>
          {invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="px-4 py-2 text-left">Invoice ID</th>
                    <th className="px-4 py-2 text-left">Amount</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Issue Date</th>
                    <th className="px-4 py-2 text-left">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-gray-200">
                      <td className="px-4 py-3">#INV{invoice.id}</td>
                      <td className="px-4 py-3 font-medium">₹{invoice.amount}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            invoice.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : invoice.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(invoice.issue_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No invoices found</p>
          )}
        </div>
      </main>
    </div>
  );
}
