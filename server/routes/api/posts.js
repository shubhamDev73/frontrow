const express = require('express');

const Connection = require('../../connection');
const objectify = require('./objectify');

const router = express();

const community = {
	id: 0,
};

router.get('/', (req, res) => {
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		connection.execute("SELECT * FROM `post` WHERE `community` = ?", [community.id], res, (results) => {
			connection.response = results;
		});
	});
});

router.get('/:post/', (req, res) => {
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		connection.execute("SELECT * FROM `post` WHERE `community` = ? AND `id` = ?", [community.id, req.params.post], res, (results) => {
			connection.response = results;
		});
	});
});

module.exports.router = router;
module.exports.community = community;
