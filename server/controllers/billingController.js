import { getDB } from '../db/config.js';
import { ObjectId } from 'mongodb';

export const getInvoices = async (req, res) => {
  try {
    const { status, patientId } = req.query;
    const db = getDB();

    let filter = {};
    if (status) filter.status = status;
    if (patientId) filter.patient_id = new ObjectId(patientId);

    const invoices = await db.collection('invoices')
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
            as: 'user',
          },
        },
        { $unwind: '$user' },
        { $sort: { created_at: -1 } },
      ])
      .toArray();

    const result = invoices.map((i) => ({
      id: i._id.toString(),
      ...i,
      first_name: i.user.first_name,
      last_name: i.user.last_name,
      email: i.user.email,
      phone: i.user.phone,
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const invoice = await db.collection('invoices')
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
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
            as: 'user',
          },
        },
        { $unwind: '$user' },
      ])
      .toArray();

    if (invoice.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const i = invoice[0];
    res.json({
      id: i._id.toString(),
      ...i,
      first_name: i.user.first_name,
      last_name: i.user.last_name,
      email: i.user.email,
      phone: i.user.phone,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const { patientId, appointmentId, amount, description, dueDate } = req.body;

    if (!patientId || !amount) {
      return res.status(400).json({ error: 'Patient ID and amount required' });
    }

    const db = getDB();
    const patient = await db.collection('patients').findOne({ user_id: new ObjectId(patientId) });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const result = await db.collection('invoices').insertOne({
      patient_id: patient._id,
      appointment_id: appointmentId ? new ObjectId(appointmentId) : null,
      amount: parseFloat(amount),
      status: 'pending',
      description,
      issue_date: new Date(),
      due_date: dueDate ? new Date(dueDate) : null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    res.status(201).json({ message: 'Invoice created', invoice: { id: result.insertedId } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

export const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentMethod, paymentDate } = req.body;

    if (!['pending', 'paid', 'overdue', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const db = getDB();
    const updateData = { status, updated_at: new Date() };
    if (paymentMethod) updateData.payment_method = paymentMethod;
    if (paymentDate) updateData.payment_date = new Date(paymentDate);

    const result = await db.collection('invoices').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({ message: 'Invoice updated', invoice: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
};

export const getPatientBilling = async (req, res) => {
  try {
    const { patientId } = req.params;
    const db = getDB();

    const patient = await db.collection('patients').findOne({ user_id: new ObjectId(patientId) });
    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const invoices = await db.collection('invoices')
      .find({ patient_id: patient._id })
      .sort({ created_at: -1 })
      .toArray();

    const result = invoices.map(i => ({
      id: i._id.toString(),
      ...i
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch patient billing' });
  }
};
