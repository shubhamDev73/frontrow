const express = require('express');

const Connection = require('../../../connection');

const router = express();

router.get('/', (req, res) => {
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		connection.execute("SELECT COUNT(*) AS `total` FROM `post`;", null, res, (results) => {
			connection.response = results[0];
		});
	});
});

router.get('/:post/', (req, res) => {
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		connection.execute("SELECT * FROM `post` WHERE `id` = ?;", [req.params.post], res, (results) => {
			connection.response = results;
		});
	});
});

module.exports = router;
