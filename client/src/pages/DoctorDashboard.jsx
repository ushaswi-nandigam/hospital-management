import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/index.js';
import { doctorAPI, appointmentAPI, leaveAPI } from '../api/index.js';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();
  const [appointments, setAppointments] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState('available');
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ reason: '', startDate: '', endDate: '' });
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [leaveError, setLeaveError] = useState('');
  const [leaveSuccess, setLeaveSuccess] = useState('');
  const [statusModal, setStatusModal] = useState({ open: false, appointmentId: null, action: '' });
  const [statusNote, setStatusNote] = useState('');

  const fetchData = async () => {
    try {
      // Always fetch fresh profile from DB (avoids stale JWT approval_status)
      const docProfileRes = await doctorAPI.getDoctorById(user.id);
      const latestApproval = docProfileRes.data.approval_status;
      setAvailabilityStatus(docProfileRes.data.availability_status || 'available');

      if (latestApproval !== user.approval_status) {
        setUser({ ...user, approval_status: latestApproval });
      }

      if (latestApproval !== 'approved') {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch ALL appointments + upcoming schedule + leave requests
      const [appointmentsRes, scheduleRes, leaveRes] = await Promise.all([
        doctorAPI.getDoctorAppointments(user.id),
        doctorAPI.getDoctorSchedule(user.id),
        leaveAPI.getMyLeaveRequests(),
      ]);
      setAppointments(appointmentsRes.data || []);
      setSchedule(scheduleRes.data || []);
      setLeaveRequests(leaveRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const handleRefreshStatus = () => {
    setRefreshing(true);
    fetchData();
  };

  const openStatusModal = (appointmentId, action) => {
    setStatusModal({ open: true, appointmentId, action });
    setStatusNote('');
  };

  const handleStatusUpdate = async () => {
    const { appointmentId, action } = statusModal;
    if (action === 'completed' && !statusNote.trim()) {
      alert('Please provide a summary for the completed appointment.');
      return;
    }
    if (action === 'cancelled' && !statusNote.trim()) {
      alert('Please provide a reason for cancellation.');
      return;
    }

    setUpdatingStatus(appointmentId);
    try {
      const payload = { status: action };
      if (action === 'completed') payload.summary = statusNote.trim();
      if (action === 'cancelled') payload.cancellationReason = statusNote.trim();
      await appointmentAPI.updateStatus(appointmentId, payload);
      setAppointments((prev) =>
        prev.map((a) => (String(a.id) === String(appointmentId) ? { ...a, status: action, summary: action === 'completed' ? statusNote.trim() : a.summary, cancellation_reason: action === 'cancelled' ? statusNote.trim() : a.cancellation_reason } : a))
      );
      setStatusModal({ open: false, appointmentId: null, action: '' });
      setStatusNote('');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update appointment status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setSubmittingLeave(true);
    setLeaveError('');
    setLeaveSuccess('');

    try {
      await leaveAPI.applyLeave(leaveForm);
      setLeaveSuccess('Leave request submitted successfully!');
      setLeaveForm({ reason: '', startDate: '', endDate: '' });
      const leaveRes = await leaveAPI.getMyLeaveRequests();
      setLeaveRequests(leaveRes.data || []);
      setTimeout(() => setShowLeaveForm(false), 1500);
    } catch (err) {
      setLeaveError(err.response?.data?.error || 'Failed to submit leave request');
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⚕️</div>
          <p className="text-gray-600 font-medium">Loading doctor panel...</p>
        </div>
      </div>
    );
  }

  // Pending Approval View
  if (user?.approval_status !== 'approved') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-medical-700 text-white shadow-md">
          <div className="container-custom flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚕️</span>
              <h1 className="text-xl font-bold">Doctor Dashboard</h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold transition"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="card max-w-lg text-center p-8 border-t-4 border-yellow-500 shadow-lg flex flex-col items-center">
            <span className="text-6xl mb-4">⏳</span>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Pending Approval</h2>
            <p className="text-gray-600 leading-relaxed">
              Welcome to the Hospital Management System, Dr. {user?.firstName || 'Doctor'}!
            </p>
            <p className="text-gray-500 mt-2 text-sm">
              Your credentials and medical license are currently under review by the administration. You will have full access once approved.
            </p>
            <div className="mt-8 flex gap-4 w-full justify-center">
              <button
                onClick={handleRefreshStatus}
                disabled={refreshing}
                className="px-5 py-2.5 bg-medical-600 hover:bg-medical-700 text-white font-semibold rounded-lg transition shadow disabled:opacity-50"
              >
                {refreshing ? 'Refreshing...' : '🔄 Refresh Status'}
              </button>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const scheduledAppts = appointments.filter((a) => a.status === 'scheduled');
  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-medical-700 text-white shadow-md">
        <div className="container-custom flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚕️</span>
            <h1 className="text-xl font-bold">Doctor Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold">Dr. {user?.firstName}</span>
            <button
              onClick={handleRefreshStatus}
              disabled={refreshing}
              title="Refresh data"
              className="px-3 py-2 bg-medical-600 hover:bg-medical-500 rounded-lg text-white transition disabled:opacity-50 text-sm"
            >
              {refreshing ? '...' : '🔄'}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container-custom py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card border-l-4 border-medical-600">
            <h3 className="text-gray-500 text-xs uppercase font-semibold">Scheduled Appointments</h3>
            <p className="text-3xl font-bold text-gray-800 mt-2">{scheduledAppts.length}</p>
          </div>
          <div className="card border-l-4 border-blue-500">
            <h3 className="text-gray-500 text-xs uppercase font-semibold">Upcoming (Future)</h3>
            <p className="text-3xl font-bold text-gray-800 mt-2">{schedule.length}</p>
          </div>
          <div className={`card border-l-4 ${availabilityStatus === 'available' ? 'border-green-500' : availabilityStatus === 'busy' ? 'border-yellow-500' : 'border-red-500'}`}>
            <h3 className="text-gray-500 text-xs uppercase font-semibold">Availability Status</h3>
            <p className={`text-2xl font-bold mt-2 capitalize ${availabilityStatus === 'available' ? 'text-green-600' : availabilityStatus === 'busy' ? 'text-yellow-600' : 'text-red-600'}`}>
              {availabilityStatus}
            </p>
            <p className="text-xs text-gray-400 mt-1">Set by hospital admin</p>
            <button
              onClick={() => { setShowLeaveForm(true); setLeaveError(''); setLeaveSuccess(''); }}
              className="mt-3 w-full px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-semibold transition"
            >
              Apply for Leave
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* All Appointments */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">All Appointments</h2>
              <button
                onClick={() => navigate('/doctor/appointments')}
                className="text-medical-600 hover:text-medical-700 text-sm font-medium underline"
              >
                Manage →
              </button>
            </div>
            {appointments.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {appointments.map((apt) => (
                  <div key={String(apt.id)} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-800">
                          {apt.patient_first_name} {apt.patient_last_name}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          📅 {new Date(apt.appointment_date).toLocaleDateString()} at{' '}
                          {new Date(apt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {apt.notes && (
                          <p className="text-xs text-gray-400 mt-2 bg-gray-50 p-2 rounded italic">
                            {apt.notes}
                          </p>
                        )}
                        {apt.status === 'completed' && apt.summary && (
                          <p className="text-xs text-green-700 mt-2 bg-green-50 p-2 rounded">
                            Summary: {apt.summary}
                          </p>
                        )}
                        {apt.status === 'cancelled' && apt.cancellation_reason && (
                          <p className="text-xs text-red-700 mt-2 bg-red-50 p-2 rounded">
                            Reason: {apt.cancellation_reason}
                          </p>
                        )}
                      </div>
                      <span className={`ml-2 shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[apt.status] || 'bg-gray-100 text-gray-600'}`}>
                        {apt.status}
                      </span>
                    </div>
                    {apt.status === 'scheduled' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => openStatusModal(apt.id, 'completed')}
                          disabled={updatingStatus === apt.id}
                          className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-semibold transition disabled:opacity-50"
                        >
                          ✓ Complete
                        </button>
                        <button
                          onClick={() => openStatusModal(apt.id, 'cancelled')}
                          disabled={updatingStatus === apt.id}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold transition disabled:opacity-50"
                        >
                          ✕ Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">No appointments yet</p>
            )}
          </div>

          {/* Upcoming Schedule */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Upcoming Schedule</h2>
            {schedule.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {schedule.slice(0, 8).map((apt) => (
                  <div key={String(apt.id)} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition">
                    <p className="font-bold text-gray-800">
                      {apt.patient_first_name} {apt.patient_last_name}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      📅 {new Date(apt.appointment_date).toLocaleDateString()} at{' '}
                      {new Date(apt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {apt.notes && (
                      <p className="text-xs text-gray-400 mt-1 italic">{apt.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">No upcoming appointments</p>
            )}
          </div>
        </div>

        {/* Leave Requests History */}
        <div className="mt-8 card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">My Leave Requests</h2>
          {leaveRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 text-left bg-gray-50">
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Start Date</th>
                    <th className="px-4 py-3">End Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Admin Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaveRequests.map((lr) => (
                    <tr key={lr.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-700">{lr.reason}</td>
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
                      <td className="px-4 py-3 text-gray-500">{lr.admin_notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-6 bg-gray-50 rounded-lg">No leave requests submitted</p>
          )}
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => navigate('/doctor/appointments')}
            className="btn-primary"
          >
            Manage All Appointments & Status
          </button>
        </div>
      </main>

      {/* Leave Application Modal */}
      {showLeaveForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Apply for Leave</h3>
              <button
                onClick={() => setShowLeaveForm(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {leaveError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {leaveError}
              </div>
            )}
            {leaveSuccess && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
                {leaveSuccess}
              </div>
            )}

            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Leave</label>
                <textarea
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="e.g. Medical reasons, personal emergency..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveForm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLeave}
                  className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {submittingLeave ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {statusModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {statusModal.action === 'completed' ? 'Complete Appointment' : 'Cancel Appointment'}
              </h3>
              <button
                onClick={() => setStatusModal({ open: false, appointmentId: null, action: '' })}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {statusModal.action === 'completed' ? 'Appointment Summary *' : 'Cancellation Reason *'}
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="input-field"
                  rows="4"
                  placeholder={
                    statusModal.action === 'completed'
                      ? 'Describe the diagnosis, treatment, and any follow-up instructions...'
                      : 'Explain why this appointment is being cancelled...'
                  }
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModal({ open: false, appointmentId: null, action: '' })}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={updatingStatus === statusModal.appointmentId || !statusNote.trim()}
                  className={`flex-1 px-4 py-2.5 text-white font-semibold rounded-lg transition disabled:opacity-50 ${
                    statusModal.action === 'completed'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {updatingStatus === statusModal.appointmentId
                    ? 'Updating...'
                    : statusModal.action === 'completed'
                    ? 'Confirm Complete'
                    : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
