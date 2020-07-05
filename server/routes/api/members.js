const express = require('express');

const Connection = require('../../connection');
const essentials = require('./essentials');

const router = express();

const group = {
	id: 0,
};

router.get('/', (req, res) => {
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		connection.execute("SELECT `member_type`, COUNT(*) AS `total` FROM `member` WHERE `group` = ? AND `leave_time` IS NULL GROUP BY `member_type`;", [group.id], res, (results) => {
			var total = 0;
			connection.response = {};
			results.forEach((result) => {
				connection.response[result['member_type'] + 's'] = result['total'];
				total += result['total'];
			});
			connection.response['total'] = total;
		});
	});
});

router.get('/new/', (req, res) => {
	const dates = essentials.getDates(req);
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		connection.execute("SELECT * FROM `member` WHERE `group` = ? AND `leave_time` IS NULL AND `join_time` BETWEEN ? AND ?;", [group.id, dates[0], dates[1]], res, (results) => {
			connection.response = essentials.objectify(results, [{'user': 'id'}, 'join_time', 'user_type']);
		});
	});
});

router.get('/left/', (req, res) => {
	const dates = essentials.getDates(req);
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		connection.execute("SELECT * FROM `member` WHERE `group` = ? AND `leave_time` BETWEEN ? AND ?;", [group.id, dates[0], dates[1]], res, (results) => {
			connection.response = essentials.objectify(results, [{'user': 'id'}, 'join_time', 'leave_time']);
		});
	});
});

router.get('/present/', (req, res) => {
	const dates = essentials.getDates(req);
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		connection.execute("SELECT * FROM `member` WHERE `group` = ? AND `join_time` <= ? AND (`leave_time` IS NULL OR `leave_time` >= ?);", [group.id, dates[0], dates[1]], res, (results) => {
			connection.response = essentials.objectify(results, [{'user': 'id'}, 'join_time', 'leave_time']);
		});
	});
});

module.exports.router = router;
module.exports.group = group;
