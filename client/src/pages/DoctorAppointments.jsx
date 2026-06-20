import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/index.js';
import { doctorAPI, appointmentAPI } from '../api/index.js';

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusModal, setStatusModal] = useState({ open: false, appointmentId: null, action: '' });
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const fetchAppointments = async (status) => {
    try {
      const params = status && status !== 'all' ? { status } : {};
      const res = await doctorAPI.getDoctorAppointments(user.id, params);
      setAppointments(res.data);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAppointments(statusFilter);
  }, [user.id, statusFilter]);

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
      setAppointments(
        appointments.map((a) => (a.id === appointmentId ? { ...a, status: action } : a))
      );
      setStatusModal({ open: false, appointmentId: null, action: '' });
      setStatusNote('');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update appointment');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
              onClick={() => navigate('/doctor')}
              className="text-white hover:bg-medical-600 px-3 py-2 rounded"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold">All Appointments</h1>
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
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'all', label: 'All' },
            { key: 'scheduled', label: 'Scheduled' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                statusFilter === tab.key
                  ? 'bg-medical-600 text-white shadow'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">
                      {appointment.patient_first_name} {appointment.patient_last_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Blood Group: {appointment.blood_group || 'N/A'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    appointment.status === 'scheduled'
                      ? 'bg-blue-100 text-blue-800'
                      : appointment.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : appointment.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {appointment.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <p>
                    <strong>Date:</strong> {new Date(appointment.appointment_date).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Time:</strong> {new Date(appointment.appointment_date).toLocaleTimeString()}
                  </p>
                </div>

                {appointment.notes && (
                  <p className="text-sm mb-4">
                    <strong>Notes:</strong> {appointment.notes}
                  </p>
                )}
                {appointment.status === 'completed' && appointment.summary && (
                  <p className="text-sm mb-4 text-green-700 bg-green-50 p-3 rounded">
                    <strong>Summary:</strong> {appointment.summary}
                  </p>
                )}
                {appointment.status === 'cancelled' && appointment.cancellation_reason && (
                  <p className="text-sm mb-4 text-red-700 bg-red-50 p-3 rounded">
                    <strong>Cancellation Reason:</strong> {appointment.cancellation_reason}
                  </p>
                )}

                <div className="flex gap-2">
                  {appointment.status === 'scheduled' && (
                    <>
                      <button
                        onClick={() => openStatusModal(appointment.id, 'completed')}
                        disabled={updatingStatus === appointment.id}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm disabled:opacity-50"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => openStatusModal(appointment.id, 'cancelled')}
                        disabled={updatingStatus === appointment.id}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {appointment.status !== 'scheduled' && (
                    <span className="text-xs text-gray-400 italic flex items-center">
                      Past appointment &mdash; viewed on{' '}
                      {new Date(appointment.updated_at || appointment.appointment_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-600">No {statusFilter !== 'all' ? statusFilter : ''} appointments found</p>
          </div>
        )}
      </main>

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
