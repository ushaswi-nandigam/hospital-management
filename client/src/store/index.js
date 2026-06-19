import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),

  login: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
}));

export const useAppointmentStore = create((set) => ({
  appointments: [],
  setAppointments: (appointments) => set({ appointments }),
  addAppointment: (appointment) =>
    set((state) => ({ appointments: [...state.appointments, appointment] })),
  updateAppointment: (id, updates) =>
    set((state) => ({
      appointments: state.appointments.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),
  deleteAppointment: (id) =>
    set((state) => ({
      appointments: state.appointments.filter((a) => a.id !== id),
    })),
}));

export const usePatientStore = create((set) => ({
  patients: [],
  currentPatient: null,
  setPatients: (patients) => set({ patients }),
  setCurrentPatient: (currentPatient) => set({ currentPatient }),
  addPatient: (patient) =>
    set((state) => ({ patients: [...state.patients, patient] })),
  updatePatient: (id, updates) =>
    set((state) => ({
      patients: state.patients.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
}));

export const useDoctorStore = create((set) => ({
  doctors: [],
  currentDoctor: null,
  setDoctors: (doctors) => set({ doctors }),
  setCurrentDoctor: (currentDoctor) => set({ currentDoctor }),
  addDoctor: (doctor) =>
    set((state) => ({ doctors: [...state.doctors, doctor] })),
}));
