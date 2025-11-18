const NotificationLog = require('../../models/notifications/notificationLogModel');

async function createNotification(userId, type, template, orderId, status) {
    const doc = new NotificationLog({ userId, type, template, orderId: orderId || null, status, read: false });
    await doc.save();
    return doc;
}

async function getUserNotifications(userId) {
    const list = await NotificationLog.find({ userId }).sort({ createdAt: -1 }).lean();
    return list;
}

async function markAsRead(notificationId) {
    const updated = await NotificationLog.findByIdAndUpdate(notificationId, { read: true }, { new: true }).lean();
    return updated;
}

async function markAllAsRead(userId) {
    await NotificationLog.updateMany({ userId, read: false }, { $set: { read: true } });
    return { success: true };
}

exports.createNotificationEndpoint = async (req, res) => {
    try {
        const { userId, type, template, orderId, status } = req.body;
        const doc = await createNotification(userId, type, template, orderId, status);
        return res.status(201).json({ success: true, data: doc });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error creating notification', error: error.message });
    }
};

exports.getUserNotificationsEndpoint = async (req, res) => {
    try {
        const { userId } = req.params;
        const items = await getUserNotifications(userId);
        return res.status(200).json({ success: true, count: items.length, data: items });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching notifications', error: error.message });
    }
};

exports.markAsReadEndpoint = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await markAsRead(id);
        if (!updated) return res.status(404).json({ success: false, message: 'Notification not found' });
        return res.status(200).json({ success: true, data: updated });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error marking as read', error: error.message });
    }
};

exports.markAllAsReadEndpoint = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await markAllAsRead(userId);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error marking all as read', error: error.message });
    }
};

exports.createNotification = createNotification;
exports.getUserNotifications = getUserNotifications;
exports.markAsRead = markAsRead;
exports.markAllAsRead = markAllAsRead;