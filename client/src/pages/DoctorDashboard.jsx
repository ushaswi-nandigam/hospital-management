import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/index.js';
import { doctorAPI, appointmentAPI } from '../api/index.js';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();
  const [appointments, setAppointments] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState('available');
  const [updatingStatus, setUpdatingStatus] = useState(null);

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

      // Fetch ALL appointments (no status filter on dashboard) + upcoming schedule
      const [appointmentsRes, scheduleRes] = await Promise.all([
        doctorAPI.getDoctorAppointments(user.id),
        doctorAPI.getDoctorSchedule(user.id),
      ]);
      setAppointments(appointmentsRes.data || []);
      setSchedule(scheduleRes.data || []);
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

  const handleStatusUpdate = async (appointmentId, status) => {
    setUpdatingStatus(appointmentId);
    try {
      await appointmentAPI.updateStatus(appointmentId, { status });
      // Optimistically update local state
      setAppointments((prev) =>
        prev.map((a) => (String(a.id) === String(appointmentId) ? { ...a, status } : a))
      );
    } catch (error) {
      alert('Failed to update appointment status. Please try again.');
    } finally {
      setUpdatingStatus(null);
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
    'no-show': 'bg-gray-100 text-gray-600',
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
                      </div>
                      <span className={`ml-2 shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[apt.status] || 'bg-gray-100 text-gray-600'}`}>
                        {apt.status}
                      </span>
                    </div>
                    {apt.status === 'scheduled' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleStatusUpdate(apt.id, 'completed')}
                          disabled={updatingStatus === apt.id}
                          className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-semibold transition disabled:opacity-50"
                        >
                          ✓ Complete
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(apt.id, 'cancelled')}
                          disabled={updatingStatus === apt.id}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold transition disabled:opacity-50"
                        >
                          ✕ Cancel
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(apt.id, 'no-show')}
                          disabled={updatingStatus === apt.id}
                          className="px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded text-xs font-semibold transition disabled:opacity-50"
                        >
                          No Show
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

        <div className="mt-8 flex gap-4">
          <button
            onClick={() => navigate('/doctor/appointments')}
            className="btn-primary"
          >
            Manage All Appointments & Status
          </button>
        </div>
      </main>
    </div>
  );
}
