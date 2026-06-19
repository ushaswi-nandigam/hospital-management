import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/index.js';
import { appointmentAPI } from '../api/index.js';

export default function PatientAppointments() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleCancel = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await appointmentAPI.cancelAppointment(appointmentId);
        setAppointments(appointments.filter((a) => a.id !== appointmentId));
      } catch (error) {
        alert('Failed to cancel appointment');
      }
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
                </div>

                {appointment.status === 'scheduled' && (
                  <button
                    onClick={() => handleCancel(appointment.id)}
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
    </div>
  );
}
