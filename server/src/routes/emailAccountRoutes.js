const express = require('express');
const emailAccountController = require('../controllers/emailAccountController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// OAuth callback is called by Google redirect directly
router.get('/oauth/callback', emailAccountController.handleOAuthCallback);

// Protected routes
router.use(authenticate);

router.get('/', emailAccountController.listAccounts);
router.get('/oauth/start', emailAccountController.startOAuth);
router.post('/sandbox', emailAccountController.createSandbox);
router.post('/:id/sync', emailAccountController.triggerSync);
router.delete('/:id', emailAccountController.disconnectAccount);

module.exports = router;
