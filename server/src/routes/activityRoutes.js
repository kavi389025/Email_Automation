const express = require('express');
const activityController = require('../controllers/activityController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.get('/', activityController.listActivity);

module.exports = router;
