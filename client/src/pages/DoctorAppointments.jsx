import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/index.js';
import { doctorAPI, appointmentAPI } from '../api/index.js';

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await doctorAPI.getDoctorAppointments(user.id);
        setAppointments(res.data);
      } catch (error) {
        console.error('Failed to load appointments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [user.id]);

  const handleStatusUpdate = async (appointmentId, status) => {
    try {
      await appointmentAPI.updateStatus(appointmentId, { status });
      setAppointments(
        appointments.map((a) => (a.id === appointmentId ? { ...a, status } : a))
      );
    } catch (error) {
      alert('Failed to update appointment');
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
                  <span className="px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800">
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

                <div className="flex gap-2">
                  {appointment.status === 'scheduled' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-600">No appointments</p>
          </div>
        )}
      </main>
    </div>
  );
}
