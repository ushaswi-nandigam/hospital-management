import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/index.js';
import { appointmentAPI, patientAPI } from '../api/index.js';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [appointments, setAppointments] = useState([]);
  const [patientInfo, setPatientInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appointmentsRes, patientRes] = await Promise.all([
          appointmentAPI.getAppointments({ patientId: user.id }),
          patientAPI.getPatientById(user.id),
        ]);
        setAppointments(appointmentsRes.data.slice(0, 3));
        setPatientInfo(patientRes.data);
      } catch (error) {
        console.error('Failed to load patient data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-medical-700 text-white shadow-md">
        <div className="container-custom flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏥</span>
            <h1 className="text-xl font-bold">Hospital Management</h1>
          </div>
          <div className="flex items-center gap-4">
            <span>Welcome, {user?.firstName}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-custom py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-gray-600 text-sm font-medium">Upcoming Appointments</h3>
            <p className="text-3xl font-bold text-medical-600 mt-2">
              {appointments.filter(a => a.status === 'scheduled').length}
            </p>
          </div>
          <div className="card">
            <h3 className="text-gray-600 text-sm font-medium">Completed Visits</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {appointments.filter(a => a.status === 'completed').length}
            </p>
          </div>
          <div className="card">
            <h3 className="text-gray-600 text-sm font-medium">Blood Group</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">{patientInfo?.blood_group || 'N/A'}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link
            to="/patient/book-appointment"
            className="btn-primary justify-center py-3"
          >
            📅 Book Appointment
          </Link>
          <Link
            to="/patient/appointments"
            className="btn-primary justify-center py-3"
          >
            📋 My Appointments
          </Link>
          <Link
            to="/patient/billing"
            className="btn-primary justify-center py-3"
          >
            💳 Billing
          </Link>
          <Link
            to="/patient/profile"
            className="btn-primary justify-center py-3"
          >
            👤 Profile
          </Link>
        </div>

        {/* Recent Appointments */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Recent Appointments</h2>
          {appointments.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      Dr. {apt.doctor_first_name} {apt.doctor_last_name}
                    </p>
                    <p className="text-sm text-gray-600">{apt.specialization}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(apt.appointment_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        apt.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : apt.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No appointments yet</p>
          )}
        </div>
      </main>
    </div>
  );
}
