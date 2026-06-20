import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/index.js';
import { adminAPI, billingAPI, patientAPI, appointmentAPI, leaveAPI } from '../api/index.js';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  
  const [stats, setStats] = useState(null);
  const [staffSchedule, setStaffSchedule] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [invoiceForm, setInvoiceForm] = useState({
    patientId: '',
    amount: '',
    description: '',
    dueDate: '',
  });
  const [submittingInvoice, setSubmittingInvoice] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cancelModal, setCancelModal] = useState({ open: false, appointmentId: null });
  const [cancelReason, setCancelReason] = useState('');

  const fetchData = async () => {
    try {
      const [statsRes, scheduleRes, pendingRes, invoicesRes, patientsRes, appointmentsRes, leaveRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getStaffSchedule(),
        adminAPI.getPendingDoctors(),
        billingAPI.getInvoices(),
        patientAPI.getPatients(),
        appointmentAPI.getAppointments(),
        leaveAPI.getAllLeaveRequests(),
      ]);
      setStats(statsRes.data);
      setStaffSchedule(scheduleRes.data);
      setPendingDoctors(pendingRes.data);
      setInvoices(invoicesRes.data);
      setPatients(patientsRes.data);
      setAppointments(appointmentsRes.data);
      setLeaveRequests(leaveRes.data);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleApproval = async (doctor_id, user_id, action) => {
    const confirmation = window.confirm(`Are you sure you want to ${action} this doctor request?`);
    if (!confirmation) return;

    try {
      await adminAPI.approveDoctorRequest({ doctor_id, user_id, action });
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || `Failed to ${action} doctor`);
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setSubmittingInvoice(true);
    setError('');
    setSuccess('');

    try {
      await billingAPI.createInvoice(invoiceForm);
      setSuccess('Invoice created successfully!');
      setInvoiceForm({
        patientId: '',
        amount: '',
        description: '',
        dueDate: '',
      });
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create invoice');
    } finally {
      setSubmittingInvoice(false);
    }
  };

  const handleMarkPaid = async (invoiceId) => {
    const confirmation = window.confirm('Mark this invoice as paid?');
    if (!confirmation) return;

    try {
      await billingAPI.updateStatus(invoiceId, {
        status: 'paid',
        paymentMethod: 'cash',
        paymentDate: new Date().toISOString(),
      });
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to mark invoice as paid');
    }
  };

  const openCancelModal = (appointmentId) => {
    setCancelModal({ open: true, appointmentId });
    setCancelReason('');
  };

  const handleCancelAppointment = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation.');
      return;
    }

    try {
      await appointmentAPI.cancelAppointment(cancelModal.appointmentId, { cancellationReason: cancelReason.trim() });
      setCancelModal({ open: false, appointmentId: null });
      setCancelReason('');
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel appointment');
    }
  };

  const handleUpdateAvailability = async (doctorId, availabilityStatus) => {
    try {
      await adminAPI.updateStaffSchedule({ doctorId, availabilityStatus });
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update doctor availability');
    }
  };

  const handleApproveLeave = async (leaveId, action) => {
    const confirmation = window.confirm(`Are you sure you want to ${action} this leave request?`);
    if (!confirmation) return;

    try {
      await leaveAPI.approveLeaveRequest(leaveId, { action });
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || `Failed to ${action} leave request`);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading admin panel...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-medical-700 text-white shadow-md">
        <div className="container-custom flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold transition"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex-1 container-custom py-8 flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
              activeTab === 'overview'
                ? 'bg-medical-600 text-white shadow'
                : 'bg-white hover:bg-gray-100 text-gray-700'
            }`}
          >
            📊 System Overview
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition flex items-center justify-between ${
              activeTab === 'approvals'
                ? 'bg-medical-600 text-white shadow'
                : 'bg-white hover:bg-gray-100 text-gray-700'
            }`}
          >
            👨‍⚕️ Doctor Approvals
            {pendingDoctors.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingDoctors.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition flex items-center justify-between ${
              activeTab === 'appointments'
                ? 'bg-medical-600 text-white shadow'
                : 'bg-white hover:bg-gray-100 text-gray-700'
            }`}
          >
            📅 All Appointments
            {appointments.filter(a => a.status === 'scheduled').length > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                {appointments.filter(a => a.status === 'scheduled').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
              activeTab === 'billing'
                ? 'bg-medical-600 text-white shadow'
                : 'bg-white hover:bg-gray-100 text-gray-700'
            }`}
          >
            💳 Invoice & Billing History
          </button>
          <button
            onClick={() => setActiveTab('leave-requests')}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition flex items-center justify-between ${
              activeTab === 'leave-requests'
                ? 'bg-medical-600 text-white shadow'
                : 'bg-white hover:bg-gray-100 text-gray-700'
            }`}
          >
            🏖️ Leave Requests
            {leaveRequests.filter(lr => lr.status === 'pending').length > 0 && (
              <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                {leaveRequests.filter(lr => lr.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('create-invoice')}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
              activeTab === 'create-invoice'
                ? 'bg-medical-600 text-white shadow'
                : 'bg-white hover:bg-gray-100 text-gray-700'
            }`}
          >
            📝 Create Invoice
          </button>
        </aside>

        {/* Tab Contents */}
        <main className="flex-1 flex flex-col gap-6">
          {activeTab === 'overview' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="card border-l-4 border-medical-600">
                  <p className="text-gray-500 text-xs uppercase font-semibold">Total Patients</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{stats?.totalPatients || 0}</p>
                </div>
                <div className="card border-l-4 border-blue-500">
                  <p className="text-gray-500 text-xs uppercase font-semibold">Total Doctors</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{stats?.totalDoctors || 0}</p>
                </div>
                <div className="card border-l-4 border-green-500">
                  <p className="text-gray-500 text-xs uppercase font-semibold">Today's Appointments</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{stats?.todaysAppointments || 0}</p>
                </div>
                <div className="card border-l-4 border-orange-500">
                  <p className="text-gray-500 text-xs uppercase font-semibold">Pending Invoices</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{stats?.pendingInvoices || 0}</p>
                </div>
                <div className="card border-l-4 border-purple-500">
                  <p className="text-gray-500 text-xs uppercase font-semibold">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">₹{stats?.monthlyRevenue?.toLocaleString() || 0}</p>
                </div>
              </div>

              {/* Staff Schedule */}
              <div className="card">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Doctor Schedule & Availablity</h2>
                {staffSchedule.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500 text-left bg-gray-50">
                          <th className="px-4 py-3">Doctor</th>
                          <th className="px-4 py-3">Specialization</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Today's Appointments</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {staffSchedule.map((doctor) => (
                          <tr key={doctor.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-semibold text-gray-700">Dr. {doctor.first_name} {doctor.last_name}</td>
                            <td className="px-4 py-3 text-gray-600">{doctor.specialization}</td>
                            <td className="px-4 py-3">
                              <select
                                value={doctor.availability_status}
                                onChange={(e) => handleUpdateAvailability(doctor.id, e.target.value)}
                                className={`px-2 py-1 rounded text-xs font-semibold border focus:outline-none focus:ring-1 focus:ring-medical-500 cursor-pointer ${
                                  doctor.availability_status === 'available'
                                    ? 'bg-green-100 text-green-800 border-green-200'
                                    : doctor.availability_status === 'busy'
                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                    : 'bg-red-100 text-red-800 border-red-200'
                                }`}
                              >
                                <option value="available">Available</option>
                                <option value="busy">Busy</option>
                                <option value="on-leave">On Leave</option>
                              </select>
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-700">{doctor.today_appointments || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No doctors on the roster.</p>
                )}
              </div>
            </>
          )}

          {activeTab === 'approvals' && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Doctor Admission Approvals</h2>
              {pendingDoctors.length > 0 ? (
                <div className="grid gap-4">
                  {pendingDoctors.map((doc) => (
                    <div key={doc.doctor_id} className="border border-gray-200 rounded-lg p-4 bg-white flex flex-col md:flex-row md:justify-between md:items-center gap-4 hover:shadow transition">
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg text-gray-800">
                          Dr. {doc.first_name} {doc.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-800">Specialization:</span> {doc.specialization}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-800">License Number:</span> <code className="bg-gray-100 px-1 rounded">{doc.license_number}</code>
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-800">Email:</span> {doc.email}
                        </p>
                        <p className="text-xs text-gray-400">
                          Applied: {new Date(doc.applied_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproval(doc.doctor_id, doc.user_id, 'approve')}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproval(doc.doctor_id, doc.user_id, 'reject')}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-medium transition"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  🎉 No pending doctor approval requests!
                </div>
              )}
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 mb-4">All Appointments</h2>
              {appointments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 text-left bg-gray-50">
                        <th className="px-4 py-3">Patient</th>
                        <th className="px-4 py-3">Doctor</th>
                        <th className="px-4 py-3">Date & Time</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Summary / Reason</th>
                        <th className="px-4 py-3">Notes</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {appointments.map((apt) => (
                        <tr key={apt.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-700">{apt.patient_first_name} {apt.patient_last_name}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            Dr. {apt.doctor_first_name} {apt.doctor_last_name}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {new Date(apt.appointment_date).toLocaleDateString()} at {new Date(apt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                apt.status === 'scheduled'
                                  ? 'bg-blue-100 text-blue-800'
                                  : apt.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {apt.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                            {apt.status === 'completed' && apt.summary ? (
                              <span title={apt.summary} className="cursor-help">{apt.summary}</span>
                            ) : apt.status === 'cancelled' && apt.cancellation_reason ? (
                              <span title={apt.cancellation_reason} className="cursor-help text-red-600">{apt.cancellation_reason}</span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{apt.notes || '-'}</td>
                          <td className="px-4 py-3 text-right">
                            {apt.status === 'scheduled' && (
                              <button
                                onClick={() => openCancelModal(apt.id)}
                                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold transition"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 py-4 text-center">No appointments booked yet.</p>
              )}
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Invoice & Billing History</h2>
              {invoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 text-left bg-gray-50">
                        <th className="px-4 py-3">Invoice</th>
                        <th className="px-4 py-3">Patient</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">#INV-{inv.id.substring(18)}</td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-700">{inv.first_name} {inv.last_name}</div>
                            <div className="text-xs text-gray-400">{inv.email}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{inv.description || 'Medical Consultation'}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800">₹{inv.amount.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                inv.status === 'paid'
                                  ? 'bg-green-100 text-green-800'
                                  : inv.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {new Date(inv.issue_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {inv.status === 'pending' && (
                              <button
                                onClick={() => handleMarkPaid(inv.id)}
                                className="px-3 py-1 bg-medical-600 hover:bg-medical-700 text-white rounded text-xs font-semibold transition"
                              >
                                Mark Paid
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 py-4 text-center">No invoices issued yet.</p>
              )}
            </div>
          )}

          {activeTab === 'leave-requests' && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Doctor Leave Requests</h2>
              {leaveRequests.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 text-left bg-gray-50">
                        <th className="px-4 py-3">Doctor</th>
                        <th className="px-4 py-3">Specialization</th>
                        <th className="px-4 py-3">Reason</th>
                        <th className="px-4 py-3">Start Date</th>
                        <th className="px-4 py-3">End Date</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {leaveRequests.map((lr) => (
                        <tr key={lr.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-gray-700">{lr.doctor_name}</td>
                          <td className="px-4 py-3 text-gray-600">{lr.specialization}</td>
                          <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{lr.reason}</td>
                          <td className="px-4 py-3 text-gray-600">{new Date(lr.start_date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-gray-600">{new Date(lr.end_date).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              lr.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : lr.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {lr.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {lr.status === 'pending' && (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleApproveLeave(lr.id, 'approved')}
                                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold transition"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleApproveLeave(lr.id, 'rejected')}
                                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold transition"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  No leave requests found.
                </div>
              )}
            </div>
          )}

          {activeTab === 'create-invoice' && (
            <div className="card max-w-2xl">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Issue New Invoice</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                  {success}
                </div>
              )}

              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Patient</label>
                  <select
                    value={invoiceForm.patientId}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, patientId: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Choose patient...</option>
                    {patients.map((pat) => (
                      <option key={pat.id} value={pat.id}>
                        {pat.first_name} {pat.last_name} ({pat.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="Enter amount"
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description / Particulars</label>
                  <textarea
                    placeholder="e.g. Cardiology checkup, blood work"
                    value={invoiceForm.description}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                    className="input-field"
                    rows="3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingInvoice}
                  className="w-full btn-primary justify-center py-2.5 text-base"
                >
                  {submittingInvoice ? 'Generating Invoice...' : 'Generate & Send Invoice'}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Cancel Appointment Modal */}
      {cancelModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Cancel Appointment</h3>
              <button
                onClick={() => setCancelModal({ open: false, appointmentId: null })}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Reason *</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="input-field"
                  rows="4"
                  placeholder="Explain why this appointment is being cancelled..."
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModal({ open: false, appointmentId: null })}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleCancelAppointment}
                  disabled={!cancelReason.trim()}
                  className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition disabled:opacity-50"
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
