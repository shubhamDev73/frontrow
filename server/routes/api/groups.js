const express = require('express');

const Connection = require('../../connection');

const router = express();

router.get('/', (req, res) => {
	console.log("GET " + req.originalUrl);

	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		connection.execute("SELECT * FROM `community`", null, res, (results) => {
			connection.response = results;
		});
	});
});

router.get('/:community/', (req, res) => {
	console.log("GET " + req.originalUrl);

	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		connection.execute("SELECT * FROM `community` WHERE `id` = ?", [req.params.community], res, (results) => {
			connection.response = results;
		});
	});
});

const members = require('./members');
router.use('/:community/members/', (req, res, next) => {
	members.community.id = req.params.community;
	next();
});
router.use('/:community/members/', members.router);

const posts = require('./posts');
router.use('/:community/posts/', (req, res, next) => {
	posts.community.id = req.params.community;
	next();
});
router.use('/:community/posts/', posts.router);

module.exports = router;
