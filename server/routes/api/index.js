const express = require('express');
const router = express();

router.get('/', (req, res) => {
	res.json({
		"version": "0.0.1",
		"message": "Root node for all api",
	});
});

const groups = require('./groups');
router.use('/groups/', groups);

module.exports = router;
