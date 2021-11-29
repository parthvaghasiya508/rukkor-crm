const { Router } =  require('express');

const AdminRoute =  require('./admin.route');
const UserRoute =  require('./user.route');
const CustomTableFieldRoute =  require('./custom_table_field.route');
const Organisation =  require('./organisation.route');
const Contact =  require('./contact.route');
const Deal =  require('./deal.route');
const Stage =  require('./stage.route');
const Notification =  require('./notification.route');
const Report =  require('./report.route');

const router = Router();

router.use('/user', UserRoute);
router.use('/admin', AdminRoute);
router.use('/custom_table', CustomTableFieldRoute);
router.use('/organisation', Organisation);
router.use('/contact', Contact);
router.use('/deal', Deal);
router.use('/stage', Stage);
router.use('/notification', Notification);
router.use('/report', Report);

module.exports = router;
