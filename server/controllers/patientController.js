import { getDB } from '../db/config.js';
import { ObjectId } from 'mongodb';

export const getPatients = async (req, res) => {
  try {
    const db = getDB();
    const patients = await db.collection('patients')
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
        { $sort: { 'user.created_at': -1 } },
      ])
      .toArray();

    const result = patients.map((p) => ({
      id: p.user._id.toString(),
      email: p.user.email,
      first_name: p.user.first_name,
      last_name: p.user.last_name,
      phone: p.user.phone,
      blood_group: p.blood_group,
      allergies: p.allergies,
      emergency_contact_name: p.emergency_contact_name,
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
};

export const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    // Check authorization
    if (req.user.role === 'patient' && req.user.id !== id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const patient = await db.collection('patients')
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

    if (patient.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const p = patient[0];
    res.json({
      id: p.user._id.toString(),
      email: p.user.email,
      first_name: p.user.first_name,
      last_name: p.user.last_name,
      phone: p.user.phone,
      date_of_birth: p.user.date_of_birth,
      blood_group: p.blood_group,
      allergies: p.allergies,
      medical_history: p.medical_history,
      emergency_contact_name: p.emergency_contact_name,
      emergency_contact_phone: p.emergency_contact_phone,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
};

export const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { bloodGroup, allergies, medicalHistory, emergencyContactName, emergencyContactPhone } = req.body;
    const db = getDB();

    // Check authorization
    if (req.user.role === 'patient' && req.user.id !== id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await db.collection('patients').findOneAndUpdate(
      { user_id: new ObjectId(id) },
      {
        $set: {
          blood_group: bloodGroup,
          allergies,
          medical_history: medicalHistory,
          emergency_contact_name: emergencyContactName,
          emergency_contact_phone: emergencyContactPhone,
        },
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({ message: 'Patient updated successfully', patient: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
};

export const getPatientMedicalHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const records = await db.collection('medical_records')
      .find({ user_id: new ObjectId(id) })
      .sort({ created_at: -1 })
      .toArray();

    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch medical history' });
  }
};

export const getPatientAppointments = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const patient = await db.collection('patients').findOne({ user_id: new ObjectId(id) });
    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const appointments = await db.collection('appointments')
      .aggregate([
        { $match: { patient_id: patient._id } },
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
        { $sort: { appointment_date: -1 } },
      ])
      .toArray();

    const result = appointments.map((a) => ({
      id: a._id.toString(),
      ...a,
      doctor_first_name: a.doctor_user.first_name,
      doctor_last_name: a.doctor_user.last_name,
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};
