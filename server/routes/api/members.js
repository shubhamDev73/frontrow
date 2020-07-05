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
		if(req.query.type){
			connection.execute("SELECT s.`join_time` FROM `member` m, `special_member` s WHERE s.`member` = m.`id` AND m.`group` = ? AND s.`leave_time` IS NULL AND s.`join_time` BETWEEN ? AND ? AND s.`member_type` = ? ORDER BY s.`join_time`;", [group.id, dates[0], dates[1], req.query.type], res, (results) => {
				connection.response = essentials.periodify(results, 'join_time', dates, false, req.query.period);
			});
		}else{
			connection.execute("SELECT `join_time` FROM `member` WHERE `group` = ? AND `leave_time` IS NULL AND `join_time` BETWEEN ? AND ? ORDER BY `join_time`;", [group.id, dates[0], dates[1]], res, (results) => {
				connection.response = essentials.periodify(results, 'join_time', dates, false, req.query.period);
			});
		}
	});
});

router.get('/new/list/', (req, res) => {
	const dates = essentials.getDates(req);
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		if(req.query.type){
			connection.execute("SELECT m.`user` AS `id`, s.`join_time`, s.`member_type` FROM `member` m, `special_member` s WHERE s.`member` = m.`id` AND m.`group` = ? AND s.`leave_time` IS NULL AND s.`join_time` BETWEEN ? AND ? AND s.`member_type` = ? ORDER BY s.`join_time`;", [group.id, dates[0], dates[1], req.query.type], res, (results) => {
				connection.response = results;
			});
		}else{
			connection.execute("SELECT `user` AS `id`, `join_time`, `member_type` FROM `member` WHERE `group` = ? AND `leave_time` IS NULL AND `join_time` BETWEEN ? AND ? ORDER BY `join_time`;", [group.id, dates[0], dates[1]], res, (results) => {
				connection.response = results;
			});
		}
	});
});

router.get('/left/', (req, res) => {
	const dates = essentials.getDates(req);
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		if(req.query.type){
			connection.execute("SELECT s.`leave_time` FROM `member` m, `special_member` s WHERE s.`member` = m.`id` AND m.`group` = ? AND s.`leave_time` BETWEEN ? AND ? AND s.`member_type` = ? ORDER BY s.`leave_time`;", [group.id, dates[0], dates[1], req.query.type], res, (results) => {
				connection.response = essentials.periodify(results, 'leave_time', dates, false, req.query.period);
			});
		}else{
			connection.execute("SELECT `leave_time` FROM `member` WHERE `group` = ? AND `leave_time` BETWEEN ? AND ? ORDER BY `leave_time`;", [group.id, dates[0], dates[1]], res, (results) => {
				connection.response = essentials.periodify(results, 'leave_time', dates, false, req.query.period);
			});
		}
	});
});

router.get('/left/list/', (req, res) => {
	const dates = essentials.getDates(req);
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		if(req.query.type){
			connection.execute("SELECT m.`user` as `id`, s.`leave_time` FROM `member` m, `special_member` s WHERE s.`member` = m.`id` AND m.`group` = ? AND s.`leave_time` BETWEEN ? AND ? AND s.`member_type` = ? ORDER BY s.`leave_time`;", [group.id, dates[0], dates[1], req.query.type], res, (results) => {
				connection.response = results;
			});
		}else{
			connection.execute("SELECT `user` as `id`, `leave_time` FROM `member` WHERE `group` = ? AND `leave_time` BETWEEN ? AND ? ORDER BY `leave_time`;", [group.id, dates[0], dates[1]], res, (results) => {
				connection.response = results;
			});
		}
	});
});

router.get('/present/', (req, res) => {
	const dates = essentials.getDates(req);
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		if(req.query.type){
			connection.execute("SELECT s.`join_time`, s.`leave_time` FROM `member` m, `special_member` s WHERE s.`member` = m.`id` AND m.`group` = ? AND s.`member_type` = ? ORDER BY s.`join_time`;", [group.id, req.query.type], res, (results) => {
				connection.response = essentials.periodify(results, 'join_time', dates, true, req.query.period);
			});
		}else{
			connection.execute("SELECT `join_time`, `leave_time` FROM `member` WHERE `group` = ? ORDER BY `join_time`;", [group.id], res, (results) => {
				connection.response = essentials.periodify(results, 'join_time', dates, true, req.query.period);
			});
		}
	});
});

router.get('/present/list/', (req, res) => {
	const dates = essentials.getDates(req);
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		if(req.query.type){
			connection.execute("SELECT m.`user` as `id`, s.`join_time`, s.`member_type` FROM `member` m, `special_member` s WHERE s.`member` = m.`id` AND m.`group` = ? AND s.`join_time` <= ? AND (s.`leave_time` IS NULL OR s.`leave_time` >= ?) AND s.`member_type` = ? ORDER BY s.`join_time`;", [group.id, dates[0], dates[1], req.query.type], res, (results) => {
				connection.response = results;
			});
		}else{
			connection.execute("SELECT `user` as `id`, `join_time`, `member_type` FROM `member` WHERE `group` = ? AND `join_time` <= ? AND (`leave_time` IS NULL OR `leave_time` >= ?) ORDER BY `join_time`;", [group.id, dates[0], dates[1]], res, (results) => {
				connection.response = results;
			});
		}
	});
});

module.exports.router = router;
module.exports.group = group;
