import { getDB } from '../db/config.js';
import { ObjectId } from 'mongodb';

export const applyLeave = async (req, res) => {
  try {
    const { reason, startDate, endDate } = req.body;

    if (!reason || !startDate || !endDate) {
      return res.status(400).json({ error: 'Reason, start date, and end date are required' });
    }

    const db = getDB();
    const doctor = await db.collection('doctors').findOne({ user_id: new ObjectId(req.user.id) });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }

    const result = await db.collection('leave_requests').insertOne({
      doctor_id: doctor._id,
      user_id: new ObjectId(req.user.id),
      reason,
      start_date: new Date(startDate),
      end_date: new Date(endDate),
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    });

    res.status(201).json({
      message: 'Leave request submitted successfully',
      leaveRequest: { id: result.insertedId.toString() },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to apply for leave' });
  }
};

export const getPendingLeaveRequests = async (req, res) => {
  try {
    const db = getDB();

    const requests = await db.collection('leave_requests')
      .aggregate([
        { $match: { status: 'pending' } },
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
            as: 'user',
          },
        },
        { $unwind: '$user' },
        { $sort: { created_at: -1 } },
      ])
      .toArray();

    const result = requests.map((r) => ({
      id: r._id.toString(),
      doctor_id: r.doctor._id.toString(),
      user_id: r.user._id.toString(),
      doctor_name: `Dr. ${r.user.first_name} ${r.user.last_name}`,
      specialization: r.doctor.specialization,
      reason: r.reason,
      start_date: r.start_date,
      end_date: r.end_date,
      status: r.status,
      applied_at: r.created_at,
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
};

export const getMyLeaveRequests = async (req, res) => {
  try {
    const db = getDB();

    const requests = await db.collection('leave_requests')
      .aggregate([
        { $match: { user_id: new ObjectId(req.user.id) } },
        {
          $lookup: {
            from: 'doctors',
            localField: 'doctor_id',
            foreignField: '_id',
            as: 'doctor',
          },
        },
        { $unwind: '$doctor' },
        { $sort: { created_at: -1 } },
      ])
      .toArray();

    const result = requests.map((r) => ({
      id: r._id.toString(),
      reason: r.reason,
      start_date: r.start_date,
      end_date: r.end_date,
      status: r.status,
      admin_notes: r.admin_notes,
      applied_at: r.created_at,
      updated_at: r.updated_at,
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch your leave requests' });
  }
};

export const approveLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminNotes } = req.body;

    if (!action || !['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ error: 'Action must be approved or rejected' });
    }

    const db = getDB();
    const leaveRequest = await db.collection('leave_requests').findOne({ _id: new ObjectId(id) });

    if (!leaveRequest) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Leave request has already been processed' });
    }

    const updateData = {
      status: action,
      updated_at: new Date(),
    };
    if (adminNotes) updateData.admin_notes = adminNotes;

    await db.collection('leave_requests').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (action === 'approved') {
      await db.collection('doctors').findOneAndUpdate(
        { _id: leaveRequest.doctor_id },
        { $set: { availability_status: 'on-leave' } }
      );
    }

    res.json({
      message: `Leave request ${action} successfully`,
      leaveRequest: {
        id: leaveRequest._id.toString(),
        status: action,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process leave request' });
  }
};

export const getAllLeaveRequests = async (req, res) => {
  try {
    const db = getDB();

    const requests = await db.collection('leave_requests')
      .aggregate([
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
            as: 'user',
          },
        },
        { $unwind: '$user' },
        { $sort: { created_at: -1 } },
      ])
      .toArray();

    const result = requests.map((r) => ({
      id: r._id.toString(),
      doctor_id: r.doctor._id.toString(),
      user_id: r.user._id.toString(),
      doctor_name: `Dr. ${r.user.first_name} ${r.user.last_name}`,
      specialization: r.doctor.specialization,
      reason: r.reason,
      start_date: r.start_date,
      end_date: r.end_date,
      status: r.status,
      admin_notes: r.admin_notes,
      applied_at: r.created_at,
      updated_at: r.updated_at,
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
};
