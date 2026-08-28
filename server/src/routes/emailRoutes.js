const express = require('express');
const { body } = require('express-validator');
const emailController = require('../controllers/emailController');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

const sendEmailValidation = [
  body('to').notEmpty().withMessage('Recipient (to) is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('bodyText').notEmpty().withMessage('Email body is required'),
];

router.get('/', emailController.listEmails);
router.get('/stats', emailController.getStats);
router.get('/thread/:threadId', emailController.getThread);
router.get('/:id', emailController.getEmail);
router.patch('/:id', emailController.updateFlags);
router.delete('/:id', emailController.trashEmail);
router.post('/send', sendEmailValidation, validate, emailController.sendEmail);

module.exports = router;
