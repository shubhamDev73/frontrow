const express = require('express');

const Connection = require('../../connection');

const router = express();

router.get('/', (req, res) => {
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		connection.execute("SELECT COUNT(*) AS `total` FROM `user`;", null, res, (results) => {
			connection.response = results[0];
		});
	});
});

router.get('/:user/', (req, res) => {
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		connection.execute("SELECT * FROM `user` WHERE `id` = ?;", [req.params.user], res, (results) => {
			connection.response = results[0];
		});
	});
});

module.exports = router;
