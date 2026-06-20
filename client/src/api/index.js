import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const patientAPI = {
  getPatients: () => api.get('/patients'),
  getPatientById: (id) => api.get(`/patients/${id}`),
  updatePatient: (id, data) => api.put(`/patients/${id}`, data),
  getPatientHistory: (id) => api.get(`/patients/${id}/medical-history`),
  getPatientAppointments: (id) => api.get(`/patients/${id}/appointments`),
};

export const doctorAPI = {
  getDoctors: (specialization) => api.get('/doctors', { params: { specialization } }),
  getDoctorById: (id) => api.get(`/doctors/${id}`),
  getDoctorAppointments: (id, params) => api.get(`/doctors/${id}/appointments`, { params }),
  getDoctorSchedule: (id, params) => api.get(`/doctors/${id}/schedule`, { params }),
  updateProfile: (id, data) => api.put(`/doctors/${id}`, data),
  createPrescription: (data) => api.post('/doctors/prescription', data),
};

export const appointmentAPI = {
  getAppointments: (params) => api.get('/appointments', { params }),
  getAppointmentById: (id) => api.get(`/appointments/${id}`),
  bookAppointment: (data) => api.post('/appointments', data),
  updateStatus: (id, data) => api.put(`/appointments/${id}/status`, data),
  cancelAppointment: (id) => api.delete(`/appointments/${id}`),
};

export const billingAPI = {
  getInvoices: (params) => api.get('/billing', { params }),
  getInvoiceById: (id) => api.get(`/billing/${id}`),
  createInvoice: (data) => api.post('/billing', data),
  updateStatus: (id, data) => api.put(`/billing/${id}/status`, data),
  getPatientBilling: (patientId) => api.get(`/billing/patient/${patientId}`),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getStaffSchedule: () => api.get('/admin/staff-schedule'),
  updateStaffSchedule: (data) => api.put('/admin/staff-schedule', data),
  getSystemStatus: () => api.get('/admin/system-status'),
  getPendingDoctors: () => api.get('/admin/pending-doctors'),
  approveDoctorRequest: (data) => api.post('/admin/approve-doctor', data),
};

export const leaveAPI = {
  applyLeave: (data) => api.post('/leave/apply', data),
  getMyLeaveRequests: () => api.get('/leave/my'),
  getPendingLeaveRequests: () => api.get('/leave/pending'),
  getAllLeaveRequests: () => api.get('/leave/all'),
  approveLeaveRequest: (id, data) => api.put(`/leave/${id}/approve`, data),
};

export default api;
