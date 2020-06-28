const express = require('express');
const router = express();

router.get('/', (req, res) => {
	console.log("GET " + req.originalUrl);
	res.render('index');
});

module.exports = router;
