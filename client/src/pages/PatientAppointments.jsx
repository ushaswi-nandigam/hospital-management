import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/index.js';
import { appointmentAPI } from '../api/index.js';

export default function PatientAppointments() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState({ open: false, appointmentId: null });
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await appointmentAPI.getAppointments({ patientId: user.id });
        setAppointments(res.data);
      } catch (error) {
        console.error('Failed to load appointments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [user.id]);

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation.');
      return;
    }
    try {
      await appointmentAPI.cancelAppointment(cancelModal.appointmentId, { cancellationReason: cancelReason.trim() });
      setAppointments(
        appointments.map((a) =>
          a.id === cancelModal.appointmentId ? { ...a, status: 'cancelled', cancellation_reason: cancelReason.trim() } : a
        )
      );
      setCancelModal({ open: false, appointmentId: null });
      setCancelReason('');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to cancel appointment');
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
              onClick={() => navigate('/patient')}
              className="text-white hover:bg-medical-600 px-3 py-2 rounded"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold">My Appointments</h1>
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
        {appointments.length > 0 ? (
          <div className="grid gap-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">
                      Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}
                    </h3>
                    <p className="text-sm text-gray-600">{appointment.specialization}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      appointment.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-800'
                        : appointment.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {appointment.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <p>
                    <strong>Date:</strong> {new Date(appointment.appointment_date).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Time:</strong> {new Date(appointment.appointment_date).toLocaleTimeString()}
                  </p>
                  {appointment.notes && <p><strong>Notes:</strong> {appointment.notes}</p>}
                  {appointment.status === 'completed' && appointment.summary && (
                    <p className="text-green-700 bg-green-50 p-2 rounded">
                      <strong>Summary:</strong> {appointment.summary}
                    </p>
                  )}
                  {appointment.status === 'cancelled' && appointment.cancellation_reason && (
                    <p className="text-red-700 bg-red-50 p-2 rounded">
                      <strong>Reason for cancellation:</strong> {appointment.cancellation_reason}
                    </p>
                  )}
                </div>

                {appointment.status === 'scheduled' && (
                  <button
                    onClick={() => { setCancelModal({ open: true, appointmentId: appointment.id }); setCancelReason(''); }}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Cancel Appointment
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-600 text-lg mb-4">No appointments found</p>
            <button
              onClick={() => navigate('/patient/book-appointment')}
              className="btn-primary"
            >
              Book Your First Appointment
            </button>
          </div>
        )}
      </main>

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
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Cancellation *</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="input-field"
                  rows="4"
                  placeholder="Please explain why you want to cancel..."
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
                  onClick={handleCancel}
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
