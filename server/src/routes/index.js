const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const activityRoutes = require('./activity.routes');
const activityContentRoutes = require('./activityContent.routes');
const achievementRoutes = require('./achievement.routes');
const lightRoutes = require('./light.routes');
const lightSettingsRoutes = require('./lightSettings.routes');
const notificationRoutes = require('./notification.routes');
const worshipRoutes = require('./worships.routes');
const theorySectionRoutes = require('./theorySection.routes');
const practicalStepRoutes = require('./practicalStep.routes');
const adminRoutes = require('./admin.routes');
const adminNotificationRoutes = require('./admin_notification.routes');
const prayerWheelEventRoutes = require('./prayerWheelEvent.routes');
const adhanRoutes = require('./adhan.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/users', userRoutes);
router.use('/activities', activityRoutes);
router.use('/contents', activityContentRoutes);
router.use('/achievements', achievementRoutes);
router.use('/light', lightRoutes);
router.use('/light-settings', lightSettingsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/worships', worshipRoutes);
router.use('/inbox', require('./inbox.routes'));
router.use('/theory-sections', theorySectionRoutes);
router.use('/practical-steps', practicalStepRoutes);
router.use('/admin/notifications', adminNotificationRoutes);
router.use('/admin', adminRoutes);
router.use('/prayer-wheel-events', prayerWheelEventRoutes);
router.use('/adhan', adhanRoutes);

module.exports = router;
