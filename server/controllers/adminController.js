import { getDB } from '../db/config.js';
import { ObjectId } from 'mongodb';

export const getDashboardStats = async (req, res) => {
  try {
    const db = getDB();
    const stats = {};

    // Total patients
    stats.totalPatients = await db.collection('patients').countDocuments();

    // Total doctors
    stats.totalDoctors = await db.collection('doctors').countDocuments();

    // Today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    stats.todaysAppointments = await db.collection('appointments').countDocuments({
      appointment_date: { $gte: today, $lt: tomorrow },
    });

    // Pending invoices
    stats.pendingInvoices = await db.collection('invoices').countDocuments({
      status: 'pending',
    });

    // Revenue this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const invoices = await db.collection('invoices')
      .aggregate([
        {
          $match: {
            status: 'paid',
            payment_date: { $gte: monthStart },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ])
      .toArray();

    stats.monthlyRevenue = invoices.length > 0 ? invoices[0].total : 0;

    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

export const getStaffSchedule = async (req, res) => {
  try {
    const db = getDB();

    const schedule = await db.collection('doctors')
      .aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $lookup: {
            from: 'appointments',
            let: { doctorId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$doctor_id', '$$doctorId'] },
                  appointment_date: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lt: new Date(new Date().setHours(24, 0, 0, 0)),
                  },
                },
              },
            ],
            as: 'today_appointments',
          },
        },
        {
          $addFields: {
            today_appointments_count: { $size: '$today_appointments' },
          },
        },
        { $sort: { 'user.last_name': 1 } },
      ])
      .toArray();

    const result = schedule.map((s) => ({
      id: s._id,
      first_name: s.user.first_name,
      last_name: s.user.last_name,
      email: s.user.email,
      specialization: s.specialization,
      availability_status: s.availability_status,
      today_appointments: s.today_appointments_count,
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch staff schedule' });
  }
};

export const updateStaffSchedule = async (req, res) => {
  try {
    const { doctorId, availabilityStatus } = req.body;

    if (!doctorId || !availabilityStatus) {
      return res.status(400).json({ error: 'Doctor ID and availability status required' });
    }

    if (!['available', 'on-leave', 'busy'].includes(availabilityStatus)) {
      return res.status(400).json({ error: 'Invalid availability status' });
    }

    const db = getDB();
    const result = await db.collection('doctors').findOneAndUpdate(
      { _id: new ObjectId(doctorId) },
      { $set: { availability_status: availabilityStatus } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({ message: 'Schedule updated', doctor: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
};

export const getSystemStatus = async (req, res) => {
  try {
    const status = {
      database: 'connected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };

    res.json(status);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch system status' });
  }
};

export const getPendingDoctors = async (req, res) => {
  try {
    const db = getDB();

    const pendingDoctors = await db.collection('doctors')
      .aggregate([
        { $match: { approval_status: 'pending' } },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 1,
            user_id: 1,
            email: '$user.email',
            first_name: '$user.first_name',
            last_name: '$user.last_name',
            phone: '$user.phone',
            specialization: 1,
            license_number: 1,
            approval_status: 1,
            created_at: 1,
          },
        },
        { $sort: { created_at: -1 } },
      ])
      .toArray();

    const result = pendingDoctors.map((doc) => ({
      doctor_id: doc._id.toString(),
      user_id: doc.user_id.toString(),
      email: doc.email,
      first_name: doc.first_name,
      last_name: doc.last_name,
      phone: doc.phone,
      specialization: doc.specialization,
      license_number: doc.license_number,
      approval_status: doc.approval_status,
      applied_at: doc.created_at,
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch pending doctors' });
  }
};

export const approveDoctorRequest = async (req, res) => {
  try {
    const { doctor_id, user_id, action } = req.body;

    if (!doctor_id || !user_id || !action) {
      return res.status(400).json({ error: 'Doctor ID, User ID, and action required' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be approve or reject' });
    }

    const db = getDB();
    const status = action === 'approve' ? 'approved' : 'rejected';

    // Update user approval status
    await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      { $set: { approval_status: status } },
      { returnDocument: 'after' }
    );

    // Update doctor approval status
    const result = await db.collection('doctors').findOneAndUpdate(
      { _id: new ObjectId(doctor_id) },
      { $set: { approval_status: status } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({
      message: `Doctor ${action}ed successfully`,
      doctor: {
        id: result._id.toString(),
        approval_status: result.approval_status,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process doctor request' });
  }
};
