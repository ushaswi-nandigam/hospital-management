# 🏥 Hospital Management System

A full-stack hospital management platform built with **React + Vite** on the frontend and **Node.js + Express + MongoDB** on the backend. It supports three distinct user roles — **Admin**, **Doctor**, and **Patient** — each with their own dashboard and functionality.

---

## ✨ Features

### 🧑‍⚕️ Patient
- Register and log in securely
- Book appointments with available, approved doctors
- View and cancel appointments
- Track billing & invoices
- Manage medical profile (blood group, allergies, emergency contact)

### 👨‍⚕️ Doctor
- Register and await admin approval before gaining access
- View all appointments (scheduled, completed, cancelled)
- Mark appointments as **Completed**, **Cancelled**, or **No-Show** inline
- See live **availability status** set by admin
- View upcoming schedule

### 🛡️ Admin
- View hospital-wide statistics (patients, doctors, appointments, revenue)
- **Approve or Reject** newly registered doctors
- **Control doctor availability** (Available / Busy / On Leave) via dropdown
- View and manage **all appointments** across the hospital
- Create and manage **patient invoices**; mark invoices as paid
- View billing history

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| State Management | Zustand |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB (via official Node.js driver v6) |
| Authentication | JWT (JSON Web Tokens) |
| Password Hashing | bcryptjs |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **MongoDB** running locally or a MongoDB Atlas connection string
- **Git**

---

### 1. Clone the repository

```bash
git clone https://github.com/ushaswi-nandigam/hospital-management.git
cd hospital-management
```

---

### 2. Configure Environment Variables

Create a `.env` file inside the `server/` directory:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=hospital_management
JWT_SECRET=your_super_secret_key
PORT=5000
```

> A template is provided at `.env.example` in the project root.

---

### 3. Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

---

### 4. Seed the Database

Run the seed script to populate initial admin, doctor, and patient accounts:

```bash
cd server
npm run seed
```

---

### 5. Run the Application

#### Option A — One-click (Windows)
Double-click `run-project.bat` in the project root. It starts both the backend and frontend automatically.

#### Option B — Manual (two terminals)

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# Runs on http://localhost:5173
```

Open your browser at **http://localhost:5173**

---

## 🔐 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@hospital.com | Admin@123 |
| **Doctor** | john.smith@hospital.com | Doctor@123 |
| **Doctor** | sarah.johnson@hospital.com | Doctor@123 |
| **Doctor** | michael.brown@hospital.com | Doctor@123 |
| **Doctor** | emily.davis@hospital.com | Doctor@123 |
| **Doctor** | robert.wilson@hospital.com | Doctor@123 |
| **Patient** | alice.thompson@gmail.com | Patient@123 |
| **Patient** | james.anderson@gmail.com | Patient@123 |

> All seeded doctors are pre-approved. Newly registered doctors start with **pending** status and must be approved by the admin.

---

## 📁 Project Structure

```
hospital-management/
├── client/                      # React + Vite frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js         # Axios API client & all API calls
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── PatientDashboard.jsx
│   │   │   ├── PatientAppointments.jsx
│   │   │   ├── AppointmentBooking.jsx
│   │   │   ├── BillingPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── DoctorDashboard.jsx
│   │   │   ├── DoctorAppointments.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── store/
│   │   │   └── index.js         # Zustand auth store
│   │   ├── App.jsx              # Routes & protected route guard
│   │   ├── main.jsx
│   │   └── index.css            # Tailwind + custom design tokens
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                      # Node.js + Express backend
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   ├── doctorController.js
│   │   ├── patientController.js
│   │   ├── appointmentController.js
│   │   └── billingController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── doctorRoutes.js
│   │   ├── patientRoutes.js
│   │   ├── appointmentRoutes.js
│   │   └── billingRoutes.js
│   ├── middleware/
│   │   └── authMiddleware.js    # JWT verify, requireRole, requireDoctorApproval
│   ├── db/
│   │   └── config.js            # MongoDB connection & indexes
│   ├── scripts/
│   │   └── seed.js              # Database seeder
│   └── index.js                 # Express app entry point
│
├── run-project.bat              # One-click launcher (Windows)
├── .env.example                 # Environment template
└── README.md
```

---

## 🔒 API Reference

### Authentication
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login and receive JWT |

### Patients
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/patients` | Doctor/Admin | List all patients |
| GET | `/api/patients/:id` | Self/Admin | Get patient profile |
| PUT | `/api/patients/:id` | Self | Update patient profile |
| GET | `/api/patients/:id/appointments` | Self | Patient's appointments |
| GET | `/api/patients/:id/medical-history` | Self/Doctor | Medical records |

### Doctors
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/doctors` | All | List all doctors |
| GET | `/api/doctors/:id` | All | Get doctor profile |
| GET | `/api/doctors/:id/appointments` | Doctor/Admin | Doctor's appointments |
| GET | `/api/doctors/:id/schedule` | Doctor | Upcoming schedule |
| PUT | `/api/doctors/:id` | Doctor/Admin | Update doctor profile |

### Appointments
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/appointments` | All (filtered) | List appointments |
| POST | `/api/appointments` | Patient | Book an appointment |
| PUT | `/api/appointments/:id/status` | Doctor/Admin | Update status |
| DELETE | `/api/appointments/:id` | Any | Cancel appointment |

### Billing
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/billing` | All | List invoices |
| GET | `/api/billing/:id` | All | Get invoice |
| POST | `/api/billing` | Admin | Create invoice |
| PUT | `/api/billing/:id/status` | Admin | Mark paid/overdue |
| GET | `/api/billing/patient/:id` | Self/Admin | Patient billing |

### Admin
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/admin/dashboard` | Admin | System statistics |
| GET | `/api/admin/staff-schedule` | Admin | Doctor roster |
| PUT | `/api/admin/staff-schedule` | Admin | Update doctor availability |
| GET | `/api/admin/pending-doctors` | Admin | Pending approval list |
| POST | `/api/admin/approve-doctor` | Admin | Approve or reject doctor |

---

## 🗄️ Database Collections

| Collection | Description |
|------------|-------------|
| `users` | Authentication store — all roles share this |
| `doctors` | Doctor-specific data (specialization, license, availability) |
| `patients` | Patient-specific data (blood group, allergies, history) |
| `appointments` | Appointment records linking doctors ↔ patients |
| `invoices` | Billing records linked to patients |
| `prescriptions` | Doctor-issued prescriptions |

> `users._id` is the shared key. `doctors.user_id` and `patients.user_id` foreign-key back to `users._id`.

---

## 🐛 Troubleshooting

### MongoDB won't connect
- Ensure MongoDB is running: `mongod` or check your Atlas URI
- Confirm `MONGODB_URI` is set correctly in `server/.env`

### "Port already in use" error
```bash
# Find and kill the process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Doctor dashboard shows "pending approval"
- Log in as Admin → **Doctor Approvals** tab → Approve the doctor
- The doctor dashboard polls the DB directly on each load, so status reflects immediately after refresh

### CORS errors in browser
- Frontend must run on `http://localhost:5173`
- Backend must run on `http://localhost:5000`
- CORS is configured in `server/index.js`

---

## 📦 Production Build

```bash
# Build frontend
cd client
npm run build

# Start backend in production mode
cd ../server
npm start
```

---

## 📄 License

MIT License — free to use for learning and commercial purposes.
