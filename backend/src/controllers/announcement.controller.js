import { Announcement } from '../models/Announcement.js';

export const getAnnouncements = async (req, res, next) => {
  try {
    const list = await Announcement.find({ companyId: req.user.companyId, isActive: true })
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

export const createAnnouncement = async (req, res, next) => {
  try {
    const { title, message, priority, targetAudience, departmentId } = req.body;
    if (!title || !message) return res.status(400).json({ success: false, message: 'Title and message are required.' });

    const item = await Announcement.create({
      companyId: req.user.companyId,
      title: title.trim(),
      message: message.trim(),
      priority: priority || 'NORMAL',
      targetAudience: targetAudience || 'ALL',
      departmentId,
      createdBy: req.user.userId,
    });

    res.status(201).json({ success: true, message: 'Announcement published.', data: item });
  } catch (error) {
    next(error);
  }
};

export const deleteAnnouncement = async (req, res, next) => {
  try {
    await Announcement.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
    res.status(200).json({ success: true, message: 'Announcement deleted.' });
  } catch (error) {
    next(error);
  }
};
