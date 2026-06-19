import { getDB } from '../db/config.js';
import { ObjectId } from 'mongodb';

export const getDoctors = async (req, res) => {
  try {
    const { specialization } = req.query;
    const db = getDB();

    let filter = {};
    if (specialization) {
      filter.specialization = { $regex: specialization, $options: 'i' };
    }

    const doctors = await db.collection('doctors')
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        { $sort: { specialization: 1, 'user.last_name': 1 } },
      ])
      .toArray();

    const result = doctors.map((d) => ({
      id: d.user._id.toString(),
      doctor_id: d._id.toString(),
      first_name: d.user.first_name,
      last_name: d.user.last_name,
      phone: d.user.phone,
      specialization: d.specialization,
      experience_years: d.experience_years,
      availability_status: d.availability_status,
      qualification: d.qualification,
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
};

export const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const doctor = await db.collection('doctors')
      .aggregate([
        { $match: { user_id: new ObjectId(id) } },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
      ])
      .toArray();

    if (doctor.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const d = doctor[0];
    res.json({
      id: d.user._id.toString(),
      doctor_id: d._id.toString(),
      first_name: d.user.first_name,
      last_name: d.user.last_name,
      phone: d.user.phone,
      email: d.user.email,
      specialization: d.specialization,
      experience_years: d.experience_years,
      availability_status: d.availability_status,
      qualification: d.qualification,
      approval_status: d.approval_status,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch doctor' });
  }
};

export const getDoctorAppointments = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;
    const db = getDB();

    const doctor = await db.collection('doctors').findOne({ user_id: new ObjectId(id) });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    let filter = { doctor_id: doctor._id };
    if (status) {
      filter.status = status;
    }

    const appointments = await db.collection('appointments')
      .aggregate([
        { $match: filter },
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
      patient_first_name: a.patient_user.first_name,
      patient_last_name: a.patient_user.last_name,
      patient_phone: a.patient_user.phone,
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

export const getDoctorSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const doctor = await db.collection('doctors').findOne({ user_id: new ObjectId(id) });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const appointments = await db.collection('appointments')
      .aggregate([
        {
          $match: {
            doctor_id: doctor._id,
            appointment_date: { $gte: new Date() },
          },
        },
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
        { $sort: { appointment_date: 1 } },
      ])
      .toArray();

    const result = appointments.map((a) => ({
      id: a._id.toString(),
      ...a,
      patient_first_name: a.patient_user.first_name,
      patient_last_name: a.patient_user.last_name,
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
};

export const updateDoctorProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { specialization, experienceYears, availabilityStatus } = req.body;
    const db = getDB();

    const updateData = {};
    if (specialization) updateData.specialization = specialization;
    if (experienceYears) updateData.experience_years = experienceYears;
    if (availabilityStatus) updateData.availability_status = availabilityStatus;

    const result = await db.collection('doctors').findOneAndUpdate(
      { user_id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({ message: 'Doctor profile updated', doctor: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update doctor profile' });
  }
};

export const createPrescription = async (req, res) => {
  try {
    const { appointmentId, patientId, medicationName, dosage, frequency, duration, notes } = req.body;

    if (!appointmentId || !patientId || !medicationName || !dosage || !frequency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = getDB();
    const result = await db.collection('prescriptions').insertOne({
      appointment_id: new ObjectId(appointmentId),
      doctor_id: new ObjectId(req.user.id),
      patient_id: new ObjectId(patientId),
      medication_name: medicationName,
      dosage,
      frequency,
      duration,
      notes,
      created_at: new Date(),
    });

    res.status(201).json({ message: 'Prescription created', prescription: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
};
