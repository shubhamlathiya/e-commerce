const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const notificationController = require('../../controllers/notifications/notificationController');

router.post('/create',
    [
        check('userId').isMongoId(),
        check('type').isIn(['email', 'sms']),
        check('template').isString(),
        check('orderId').optional().isMongoId(),
        check('status').isIn(['sent', 'failed'])
    ],
    notificationController.createNotificationEndpoint
);

router.get('/user/:userId',
    [
        check('userId').isMongoId()
    ],
    notificationController.getUserNotificationsEndpoint
);

router.patch('/read/:id',
    [
        check('id').isMongoId()
    ],
    notificationController.markAsReadEndpoint
);

router.patch('/read-all/:userId',
    [
        check('userId').isMongoId()
    ],
    notificationController.markAllAsReadEndpoint
);

module.exports = router;