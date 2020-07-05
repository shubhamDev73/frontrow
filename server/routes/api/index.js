const express = require('express');

const router = express();

router.get('/', (req, res) => {
	res.json({
		"version": "0.0.3",
		"message": "Root node for all API calls. If you are seeing this, everything has been setup correctly. For usage, see documentation at /api/docs/",
	});
});

router.use('/docs/', (req, res) => {
	res.render('docs');
});

const groups = require('./groups');
router.use('/groups/', groups);

const users = require('./users');
router.use('/users/', users);

module.exports = router;
