import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/index.js';
import { patientAPI } from '../api/index.js';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [profileData, setProfileData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await patientAPI.getPatientById(user.id);
        setProfileData(res.data);
        setFormData(res.data);
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await patientAPI.updatePatient(user.id, {
        bloodGroup: formData.blood_group,
        allergies: formData.allergies,
        medicalHistory: formData.medical_history,
        emergencyContactName: formData.emergency_contact_name,
        emergencyContactPhone: formData.emergency_contact_phone,
      });
      setMessage('Profile updated successfully!');
      setEditMode(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to update profile');
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
            <h1 className="text-xl font-bold">My Profile</h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="container-custom py-8 max-w-2xl">
        {message && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}

        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Personal Information</h2>
            <button
              onClick={() => (editMode ? handleSave() : setEditMode(true))}
              className="btn-primary"
            >
              {editMode ? 'Save Changes' : 'Edit Profile'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={profileData?.first_name || ''}
                  disabled
                  className="input-field bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={profileData?.last_name || ''}
                  disabled
                  className="input-field bg-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={profileData?.email || ''}
                disabled
                className="input-field bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={profileData?.phone || ''}
                disabled
                className="input-field bg-gray-100"
              />
            </div>

            <hr className="my-6" />

            <h3 className="text-lg font-bold mb-4">Medical Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                <input
                  type="text"
                  name="blood_group"
                  value={formData?.blood_group || ''}
                  onChange={handleChange}
                  disabled={!editMode}
                  className={`input-field ${!editMode ? 'bg-gray-100' : ''}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={profileData?.date_of_birth ? profileData.date_of_birth.split('T')[0] : ''}
                  disabled
                  className="input-field bg-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
              <textarea
                name="allergies"
                value={formData?.allergies || ''}
                onChange={handleChange}
                disabled={!editMode}
                className={`input-field ${!editMode ? 'bg-gray-100' : ''}`}
                placeholder="List any allergies..."
                rows="3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medical History</label>
              <textarea
                name="medical_history"
                value={formData?.medical_history || ''}
                onChange={handleChange}
                disabled={!editMode}
                className={`input-field ${!editMode ? 'bg-gray-100' : ''}`}
                placeholder="Medical history and conditions..."
                rows="3"
              />
            </div>

            <hr className="my-6" />

            <h3 className="text-lg font-bold mb-4">Emergency Contact</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
              <input
                type="text"
                name="emergency_contact_name"
                value={formData?.emergency_contact_name || ''}
                onChange={handleChange}
                disabled={!editMode}
                className={`input-field ${!editMode ? 'bg-gray-100' : ''}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                name="emergency_contact_phone"
                value={formData?.emergency_contact_phone || ''}
                onChange={handleChange}
                disabled={!editMode}
                className={`input-field ${!editMode ? 'bg-gray-100' : ''}`}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
