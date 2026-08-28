const express = require('express');
const { body } = require('express-validator');
const aiController = require('../controllers/aiController');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.post('/summarize', aiController.summarize);
router.post(
  '/generate-reply',
  [body('emailId').notEmpty().withMessage('emailId is required')],
  validate,
  aiController.createReply
);
router.post(
  '/classify',
  [body('emailId').notEmpty().withMessage('emailId is required')],
  validate,
  aiController.classify
);
router.get('/activity', aiController.getActivity);

module.exports = router;
