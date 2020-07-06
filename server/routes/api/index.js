const express = require('express');

const router = express();

router.get('/', (req, res) => {
	res.json({
		"version": "0.0.4",
		"message": "Root node for all API calls. If you are seeing this, everything has been setup correctly. For usage, see documentation at /api/docs/",
	});
});

router.use('/docs/', (req, res) => {
	res.render('docs');
});

const groups = require('./groups/index');
router.use('/groups/', groups);

const users = require('./users/index');
router.use('/users/', users);

const posts = require('./posts/index');
router.use('/posts/', posts);

module.exports = router;
