const express = require('express');

const Connection = require('../../../connection');
const essentials = require('../essentials');

const router = express();

const group = {
	id: 0,
};

router.get('/', (req, res) => {
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		connection.execute("SELECT m.`member_type`, COUNT(*) AS `total` FROM `member` m WHERE m.`group` = ? AND m.`leave_time` IS NULL GROUP BY m.`member_type`;", [group.id], res, (results) => {
			connection.response = essentials.count(results, 'member_type', ['admin', 'moderator', 'creator', 'banned']);
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
			connection.execute("SELECT m.`join_time` FROM `member` m WHERE m.`group` = ? AND m.`leave_time` IS NULL AND m.`join_time` BETWEEN ? AND ? ORDER BY m.`join_time`;", [group.id, dates[0], dates[1]], res, (results) => {
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
			connection.execute("SELECT u.`id`, u.`name`, s.`join_time`, s.`member_type` FROM `member` m, `user` u, `special_member` s WHERE s.`member` = m.`id` AND m.`user` = u.`id` AND m.`group` = ? AND s.`leave_time` IS NULL AND s.`join_time` BETWEEN ? AND ? AND s.`member_type` = ? ORDER BY s.`join_time`;", [group.id, dates[0], dates[1], req.query.type], res, (results) => {
				connection.response = results;
			});
		}else{
			connection.execute("SELECT u.`id`, u.`name`, m.`join_time`, m.`member_type` FROM `member` m, `user` u WHERE m.`user` = u.`id` AND `group` = ? AND m.`leave_time` IS NULL AND m.`join_time` BETWEEN ? AND ? ORDER BY m.`join_time`;", [group.id, dates[0], dates[1]], res, (results) => {
				connection.response = results;
			});
		}
	});
});

router.get('/total/', (req, res) => {
	const dates = essentials.getDates(req);
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		if(req.query.type){
			connection.execute("SELECT s.`join_time`, s.`leave_time` FROM `member` m, `special_member` s WHERE s.`member` = m.`id` AND m.`group` = ? AND s.`member_type` = ? ORDER BY s.`join_time`;", [group.id, req.query.type], res, (results) => {
				connection.response = essentials.periodify(results, 'join_time', dates, true, req.query.period);
			});
		}else{
			connection.execute("SELECT m.`join_time`, m.`leave_time` FROM `member` m WHERE m.`group` = ? ORDER BY m.`join_time`;", [group.id], res, (results) => {
				connection.response = essentials.periodify(results, 'join_time', dates, true, req.query.period);
			});
		}
	});
});

router.get('/total/list/', (req, res) => {
	const dates = essentials.getDates(req);
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		if(req.query.type){
			connection.execute("SELECT u.`id`, u.`name`, s.`join_time`, s.`member_type` FROM `member` m, `user` u, `special_member` s WHERE s.`member` = m.`id` AND m.`group` = ? AND s.`join_time` <= ? AND (s.`leave_time` IS NULL OR s.`leave_time` >= ?) AND s.`member_type` = ? ORDER BY s.`join_time`;", [group.id, dates[0], dates[1], req.query.type], res, (results) => {
				connection.response = results;
			});
		}else{
			connection.execute("SELECT u.`id`, u.`name`, m.`join_time`, m.`member_type` FROM `member` m , `user` u WHERE m.`user` = u.`id` AND m.`group` = ? AND m.`join_time` <= ? AND (m.`leave_time` IS NULL OR m.`leave_time` >= ?) ORDER BY m.`join_time`;", [group.id, dates[0], dates[1]], res, (results) => {
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
			connection.execute("SELECT m.`leave_time` FROM `member` m WHERE m.`group` = ? AND m.`leave_time` BETWEEN ? AND ? ORDER BY m.`leave_time`;", [group.id, dates[0], dates[1]], res, (results) => {
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
			connection.execute("SELECT u.`id`, s.`leave_time` FROM `member` m, `user` u, `special_member` s WHERE s.`member` = m.`id` AND m.`user` = u.`id` AND m.`group` = ? AND s.`leave_time` BETWEEN ? AND ? AND s.`member_type` = ? ORDER BY s.`leave_time`;", [group.id, dates[0], dates[1], req.query.type], res, (results) => {
				connection.response = results;
			});
		}else{
			connection.execute("SELECT u.`id`, u.`name`, m.`leave_time` FROM `member` m, `user` u WHERE m.`user` = u.`id` AND m.`group` = ? AND m.`leave_time` BETWEEN ? AND ? ORDER BY m.`leave_time`;", [group.id, dates[0], dates[1]], res, (results) => {
				connection.response = results;
			});
		}
	});
});

router.get('/list/', (req, res) => {
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		if(req.query.type){
			connection.execute("SELECT u.`id`, u.`name`, s.`join_time`, s.`member_type` FROM `member` m, `user` u, `special_member` s WHERE s.`member` = m.`id` AND m.`user` = u.`id` AND m.`group` = ? AND s.`leave_time` IS NULL AND s.`member_type` = ? ORDER BY s.`join_time` DESC;", [group.id, req.query.type], res, (results) => {
				connection.response = results;
			});
		}else{
			connection.execute("SELECT u.`id`, u.`name`, m.`join_time`, m.`member_type` FROM `member` m, `user` u WHERE m.`user` = u.`id` AND m.`group` = ? AND m.`leave_time` IS NULL ORDER BY m.`join_time` DESC;", [group.id], res, (results) => {
				connection.response = results;
			});
		}
	});
});

module.exports.router = router;
module.exports.group = group;
