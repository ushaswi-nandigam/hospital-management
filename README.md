# Hospital Management System

A comprehensive hospital management platform with patient records, appointment scheduling, billing, and doctor consultations using modern web technologies.

## 🏥 Features

- **Patient Management**: Complete medical profiles with history
- **Appointment Scheduling**: Easy booking with available doctors
- **Billing System**: Invoice generation and payment tracking
- **Prescriptions**: Digital prescription management
- **Doctor Dashboard**: Patient appointments and consultations
- **Admin Dashboard**: Hospital operations and staff scheduling
- **Role-Based Access**: Separate interfaces for Patients, Doctors, and Admins
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

**Frontend:**
- React 18 with Vite
- Tailwind CSS for styling
- Zustand for state management
- React Router for navigation
- Axios for API communication

**Backend:**
- Node.js with Express.js
- PostgreSQL database
- JWT authentication
- Role-based authorization

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL 12+
- Git

### Installation & Setup

#### 1. Install Dependencies

```bash
# Backend dependencies
cd server
npm install

# Frontend dependencies
cd ../client
npm install
```

#### 2. Database Setup

```bash
# Create PostgreSQL database
createdb hospital_management

# Initialize schema (in server directory)
psql -d hospital_management -f db/init.sql

# Seed demo data
npm run seed
```

#### 3. Environment Variables

Create `.env` file in the `server` directory:
```
DATABASE_URL=postgresql://localhost/hospital_management
NODE_ENV=development
PORT=5000
JWT_SECRET=dev_secret_key
```

#### 4. Run Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
# Backend runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
# Frontend runs on http://localhost:5173
```

## 📝 Demo Credentials

After seeding the database:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hospital.com | password |
| Doctor | doctor1@hospital.com | password |
| Patient | patient1@hospital.com | password |

## 📁 Project Structure

```
hospital-management/
├── client/                 # React Vite frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── store/         # Zustand state management
│   │   ├── api/           # API utilities
│   │   └── index.css      # Tailwind styles
│   └── vite.config.js
├── server/                 # Node.js Express backend
│   ├── db/                # Database config & migrations
│   ├── routes/            # API routes
│   ├── controllers/       # Business logic
│   ├── middleware/        # Auth & validation
│   └── index.js           # Entry point
├── .env.example           # Environment template
└── README.md
```

## 🎯 Core Features

### Patient Dashboard
- View upcoming appointments
- Book new appointments with doctors
- Access billing and invoices
- Manage medical profile
- View medical history

### Doctor Dashboard
- See scheduled appointments
- View patient information
- Manage appointment status
- Access patient medical records
- Create prescriptions

### Admin Dashboard
- Hospital statistics
- Staff scheduling
- Resource allocation
- Billing overview
- System monitoring

## 🔒 API Endpoints

**Authentication:**
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout

**Patients:**
- `GET /api/patients` - List all patients (doctor/admin)
- `GET /api/patients/:id` - Get patient details
- `PUT /api/patients/:id` - Update patient profile
- `GET /api/patients/:id/medical-history` - Medical records
- `GET /api/patients/:id/appointments` - Patient appointments

**Doctors:**
- `GET /api/doctors` - List all doctors
- `GET /api/doctors/:id` - Doctor details
- `GET /api/doctors/:id/appointments` - Doctor's appointments

**Appointments:**
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Book appointment
- `PUT /api/appointments/:id/status` - Update status
- `DELETE /api/appointments/:id` - Cancel appointment

**Billing:**
- `GET /api/billing` - List invoices
- `POST /api/billing` - Create invoice
- `PUT /api/billing/:id/status` - Update invoice status

**Admin:**
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/staff-schedule` - Staff info
- `PUT /api/admin/staff-schedule` - Update staff availability

## 🐛 Troubleshooting

### Backend won't connect to database
```bash
# Check PostgreSQL is running
psql --version

# Create database if not exists
createdb hospital_management

# Run migrations
psql -d hospital_management -f server/db/init.sql
```

### CORS errors
- Frontend runs on `http://localhost:5173`
- Backend runs on `http://localhost:5000`
- CORS is configured in `server/index.js`

### npm install fails
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 📦 Building for Production

```bash
# Build frontend
cd client
npm run build

# Build backend (if needed)
cd ../server
npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Commit: `git commit -m "Add your feature"`
4. Push: `git push origin feature/your-feature`

## 📄 License

MIT License - feel free to use this project for learning and commercial purposes.
