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
		connection.execute("SELECT * FROM `activity` WHERE `community` = ? AND `leave_time` IS NULL", [community.id], res, (results) => {
			connection.response = objectify(results, [{'user': 'id'}, 'join_time', 'user_type']);
		});
	});
});

router.get('/:member/', (req, res) => {
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		connection.execute("SELECT * FROM `user` WHERE `id` = ?", [req.params.member], res, (results) => {
			connection.response = results;
		});
	});
});

module.exports.router = router;
module.exports.community = community;
