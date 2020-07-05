const express = require('express');

const Connection = require('../../connection');
const objectify = require('./objectify');

const router = express();

const group = {
	id: 0,
};

router.get('/', (req, res) => {
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		connection.execute("SELECT * FROM `post` WHERE `group` = ?", [group.id], res, (results) => {
			connection.response = results;
		});
	});
});

router.get('/:post/', (req, res) => {
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		connection.execute("SELECT * FROM `post` WHERE `group` = ? AND `id` = ?", [group.id, req.params.post], res, (results) => {
			connection.response = results;
		});
	});
});

module.exports.router = router;
module.exports.group = group;
