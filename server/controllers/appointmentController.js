import { getDB } from '../db/config.js';
import { ObjectId } from 'mongodb';

export const getAppointments = async (req, res) => {
  try {
    const { status, doctorId, patientId } = req.query;
    const db = getDB();

    let filter = {};
    if (status) filter.status = status;
    if (doctorId) {
      const doctor = await db.collection('doctors').findOne({ user_id: new ObjectId(doctorId) });
      if (doctor) {
        filter.doctor_id = doctor._id;
      } else {
        return res.json([]);
      }
    }
    if (patientId) {
      const patient = await db.collection('patients').findOne({ user_id: new ObjectId(patientId) });
      if (patient) {
        filter.patient_id = patient._id;
      } else {
        return res.json([]);
      }
    }

    const appointments = await db.collection('appointments')
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'doctors',
            localField: 'doctor_id',
            foreignField: '_id',
            as: 'doctor',
          },
        },
        { $unwind: '$doctor' },
        {
          $lookup: {
            from: 'users',
            localField: 'doctor.user_id',
            foreignField: '_id',
            as: 'doctor_user',
          },
        },
        { $unwind: '$doctor_user' },
        {
          $lookup: {
            from: 'patients',
            localField: 'patient_id',
            foreignField: '_id',
            as: 'patient',
          },
        },
        { $unwind: '$patient' },
        {
          $lookup: {
            from: 'users',
            localField: 'patient.user_id',
            foreignField: '_id',
            as: 'patient_user',
          },
        },
        { $unwind: '$patient_user' },
        { $sort: { appointment_date: -1 } },
      ])
      .toArray();

    const result = appointments.map((a) => ({
      id: a._id.toString(),
      ...a,
      doctor_first_name: a.doctor_user.first_name,
      doctor_last_name: a.doctor_user.last_name,
      patient_first_name: a.patient_user.first_name,
      patient_last_name: a.patient_user.last_name,
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const appointment = await db.collection('appointments')
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: 'doctors',
            localField: 'doctor_id',
            foreignField: '_id',
            as: 'doctor',
          },
        },
        { $unwind: '$doctor' },
        {
          $lookup: {
            from: 'users',
            localField: 'doctor.user_id',
            foreignField: '_id',
            as: 'doctor_user',
          },
        },
        { $unwind: '$doctor_user' },
        {
          $lookup: {
            from: 'patients',
            localField: 'patient_id',
            foreignField: '_id',
            as: 'patient',
          },
        },
        { $unwind: '$patient' },
        {
          $lookup: {
            from: 'users',
            localField: 'patient.user_id',
            foreignField: '_id',
            as: 'patient_user',
          },
        },
        { $unwind: '$patient_user' },
      ])
      .toArray();

    if (appointment.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const a = appointment[0];
    res.json({
      id: a._id.toString(),
      ...a,
      doctor_first_name: a.doctor_user.first_name,
      doctor_last_name: a.doctor_user.last_name,
      patient_first_name: a.patient_user.first_name,
      patient_last_name: a.patient_user.last_name,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
};

export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, notes } = req.body;
    const userId = new ObjectId(req.user.id);

    if (!doctorId || !appointmentDate) {
      return res.status(400).json({ error: 'Doctor ID and appointment date required' });
    }

    const db = getDB();
    const patient = await db.collection('patients').findOne({ user_id: userId });

    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const doctor = await db.collection('doctors').findOne({ user_id: new ObjectId(doctorId) });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (doctor.approval_status !== 'approved') {
      return res.status(400).json({ error: 'Doctor is pending approval and cannot accept appointments' });
    }

    const result = await db.collection('appointments').insertOne({
      patient_id: patient._id,
      doctor_id: doctor._id,
      appointment_date: new Date(appointmentDate),
      status: 'scheduled',
      notes,
      created_at: new Date(),
      updated_at: new Date(),
    });

    res.status(201).json({ message: 'Appointment booked successfully', appointment: { id: result.insertedId } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['scheduled', 'completed', 'cancelled', 'no-show'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const db = getDB();
    const result = await db.collection('appointments').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status, updated_at: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ message: 'Appointment status updated', appointment: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const result = await db.collection('appointments').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status: 'cancelled', updated_at: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ message: 'Appointment cancelled', appointment: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
};
