const express = require('express');

const Connection = require('../../../connection');

const router = express();

router.get('/', (req, res) => {
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		connection.execute("SELECT * FROM `group`", null, res, (results) => {
			connection.response = results;
		});
	});
});

router.get('/:group/', (req, res) => {
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		connection.execute("SELECT * FROM `group` WHERE `id` = ?", [req.params.group], res, (results) => {
			connection.response = results[0];
		});
	});
});

const members = require('./members');
router.use('/:group/members/', (req, res, next) => {
	members.group.id = req.params.group;
	next();
});
router.use('/:group/members/', members.router);

const posts = require('./posts');
router.use('/:group/posts/', (req, res, next) => {
	posts.group.id = req.params.group;
	next();
});
router.use('/:group/posts/', posts.router);

module.exports = router;
