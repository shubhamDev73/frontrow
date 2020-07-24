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
		connection.execute("SELECT `type`, COUNT(*) AS `total` FROM `post` WHERE `group` = ? GROUP BY `type`;", [group.id], res, (results) => {
			connection.response = essentials.count(results, 'type', ['poll', 'first', 'link', 'share', 'with']);
		});
	});
});

router.get('/new/', (req, res) => {
	const dates = essentials.getDates(req);
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		if(req.query.type){
			connection.execute("SELECT `time` FROM `post` WHERE `group` = ? AND `time` BETWEEN ? AND ? AND `type` = ? ORDER BY `time`;", [group.id, dates[0], dates[1], req.query.type], res, (results) => {
				connection.response = essentials.periodify(results, 'time', dates, req.query.period);
			});
		}else{
			connection.execute("SELECT `time` FROM `post` WHERE `group` = ? AND `time` BETWEEN ? AND ? ORDER BY `time`;", [group.id, dates[0], dates[1]], res, (results) => {
				connection.response = essentials.periodify(results, 'time', dates, req.query.period);
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
			connection.execute("SELECT `time` FROM `post` WHERE `group` = ? AND `time` BETWEEN ? AND ? AND `type` = ? ORDER BY `time`;", [group.id, dates[0], dates[1], req.query.type], res, (results) => {
				connection.response = essentials.periodify(results, 'time', dates, req.query.period, true);
			});
		}else{
			connection.execute("SELECT `time` FROM `post` WHERE `group` = ? AND `time` BETWEEN ? AND ? ORDER BY `time`;", [group.id, dates[0], dates[1]], res, (results) => {
				connection.response = essentials.periodify(results, 'time', dates, req.query.period, true);
			});
		}
	});
});

router.get('/list/', (req, res) => {
	const dates = essentials.getDates(req);
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		if(req.query.type){
			connection.execute("SELECT * FROM `post` WHERE `group` = ? AND `time` BETWEEN ? AND ? AND `type` = ? ORDER BY `time`;", [group.id, dates[0], dates[1], req.query.type], res, (results) => {
				connection.response = results;
			});
		}else{
			connection.execute("SELECT * FROM `post` WHERE `group` = ? AND `time` BETWEEN ? AND ? ORDER BY `time`;", [group.id, dates[0], dates[1]], res, (results) => {
				connection.response = results;
			});
		}
	});
});

router.get('/by/', (req, res) => {
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		if(req.query.type){
			connection.execute("SELECT `user`, COUNT(*) as `total` FROM `post` WHERE `group` = ? AND `type` = ? GROUP BY `user` ORDER BY COUNT(*) DESC;", [group.id, req.query.type], res, (results) => {
				connection.response = essentials.count(results, 'user');
			});
		}else{
			connection.execute("SELECT `user`, COUNT(*) as `total` FROM `post` WHERE `group` = ? GROUP BY `user` ORDER BY COUNT(*) DESC;", [group.id], res, (results) => {
				connection.response = essentials.count(results, 'user');
			});
		}
	});
});

router.get('/by/:user(\\d+)/', (req, res) => {
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		connection.execute("SELECT `type`, COUNT(*) as `total` FROM `post` WHERE `group` = ? AND `user` = ? GROUP BY `type`;", [group.id, req.params.user], res, (results) => {
			connection.response = essentials.count(results, 'type', ['poll', 'first', 'link', 'share', 'with']);
		});
	});
});

router.get('/by/:user(\\d+)/new/', (req, res) => {
	const dates = essentials.getDates(req);
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		if(req.query.type){
			connection.execute("SELECT `time` FROM `post` WHERE `group` = ? AND `user` = ? AND `time` BETWEEN ? AND ? AND `type` = ? ORDER BY `time`;", [group.id, req.params.user, dates[0], dates[1], req.query.type], res, (results) => {
				connection.response = essentials.periodify(results, 'time', dates, req.query.period);
			});
		}else{
			connection.execute("SELECT `time` FROM `post` WHERE `group` = ? AND `user` = ? AND `time` BETWEEN ? AND ? ORDER BY `time`;", [group.id, req.params.user, dates[0], dates[1]], res, (results) => {
				connection.response = essentials.periodify(results, 'time', dates, req.query.period);
			});
		}
	});
});

router.get('/by/:user(\\d+)/total/', (req, res) => {
	const dates = essentials.getDates(req);
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		if(req.query.type){
			connection.execute("SELECT `time` FROM `post` WHERE `group` = ? AND `user` = ? AND `time` BETWEEN ? AND ? AND `type` = ? ORDER BY `time`;", [group.id, req.params.user, dates[0], dates[1], req.query.type], res, (results) => {
				connection.response = essentials.periodify(results, 'time', dates, req.query.period, true);
			});
		}else{
			connection.execute("SELECT `time` FROM `post` WHERE `group` = ? AND `user` = ? AND `time` BETWEEN ? AND ? ORDER BY `time`;", [group.id, req.params.user, dates[0], dates[1]], res, (results) => {
				connection.response = essentials.periodify(results, 'time', dates, req.query.period, true);
			});
		}
	});
});

router.get('/by/:user(\\d+)/list/', (req, res) => {
	const dates = essentials.getDates(req);
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		if(req.query.type){
			connection.execute("SELECT * FROM `post` WHERE `group` = ? AND `user` = ? AND `time` BETWEEN ? AND ? AND `type` = ? ORDER BY `time`;", [group.id, req.params.user, dates[0], dates[1], req.query.type], res, (results) => {
				connection.response = results;
			});
		}else{
			connection.execute("SELECT * FROM `post` WHERE `group` = ? AND `user` = ? AND `time` BETWEEN ? AND ? ORDER BY `time`;", [group.id, req.params.user, dates[0], dates[1]], res, (results) => {
				connection.response = results;
			});
		}
	});
});

router.get('/by/:type(\\w+)/', (req, res) => {
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		connection.execute("SELECT p.`type`, COUNT(*) as `total` FROM `post` p, `member` m WHERE p.`user` = m.`user` AND p.`group` = m.`group` AND p.`group` = ? AND m.`leave_time` IS NULL AND m.`member_type` = ? GROUP BY p.`type`;", [group.id, req.params.type], res, (results) => {
			connection.response = essentials.count(results, 'type', ['poll', 'first', 'link', 'share', 'with']);
		});
	});
});

router.get('/by/:type(\\w+)/new/', (req, res) => {
	const dates = essentials.getDates(req);
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		if(req.query.type){
			connection.execute("SELECT `time` FROM `post` p, `member` m WHERE p.`user` = m.`user` AND p.`group` = m.`group` AND p.`group` = ? AND m.`leave_time` IS NULL AND m.`member_type` = ? AND `time` BETWEEN ? AND ? AND p.`type` = ? ORDER BY `time`;", [group.id, req.params.type, dates[0], dates[1], req.query.type], res, (results) => {
				connection.response = essentials.periodify(results, 'time', dates, req.query.period);
			});
		}else{
			connection.execute("SELECT `time` FROM `post` p, `member` m WHERE p.`user` = m.`user` AND p.`group` = m.`group` AND p.`group` = ? AND m.`leave_time` IS NULL AND m.`member_type` = ? AND `time` BETWEEN ? AND ? ORDER BY `time`;", [group.id, req.params.type, dates[0], dates[1]], res, (results) => {
				connection.response = essentials.periodify(results, 'time', dates, req.query.period);
			});
		}
	});
});

router.get('/by/:type(\\w+)/total/', (req, res) => {
	const dates = essentials.getDates(req);
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		if(req.query.type){
			connection.execute("SELECT `time` FROM `post` p, `member` m WHERE p.`user` = m.`user` AND p.`group` = m.`group` AND p.`group` = ? AND m.`leave_time` IS NULL AND m.`member_type` = ? AND `time` BETWEEN ? AND ? AND p.`type` = ? ORDER BY `time`;", [group.id, req.params.type, dates[0], dates[1], req.query.type], res, (results) => {
				connection.response = essentials.periodify(results, 'time', dates, req.query.period, true);
			});
		}else{
			connection.execute("SELECT `time` FROM `post` p, `member` m WHERE p.`user` = m.`user` AND p.`group` = m.`group` AND p.`group` = ? AND m.`leave_time` IS NULL AND m.`member_type` = ? AND `time` BETWEEN ? AND ? ORDER BY `time`;", [group.id, req.params.type, dates[0], dates[1]], res, (results) => {
				connection.response = essentials.periodify(results, 'time', dates, req.query.period, true);
			});
		}
	});
});

router.get('/by/:type(\\w+)/list/', (req, res) => {
	const dates = essentials.getDates(req);
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		if(req.query.type){
			connection.execute("SELECT * FROM `post` p, `member` m WHERE p.`user` = m.`user` AND p.`group` = m.`group` AND p.`group` = ? AND m.`leave_time` IS NULL AND m.`member_type` = ? AND `time` BETWEEN ? AND ? AND p.`type` = ? ORDER BY `time`;", [group.id, req.params.type, dates[0], dates[1], req.query.type], res, (results) => {
				connection.response = results;
			});
		}else{
			connection.execute("SELECT * FROM `post` p, `member` m WHERE p.`user` = m.`user` AND p.`group` = m.`group` AND p.`group` = ? AND m.`leave_time` IS NULL AND m.`member_type` = ? AND `time` BETWEEN ? AND ? ORDER BY `time`;", [group.id, req.params.type, dates[0], dates[1]], res, (results) => {
				connection.response = results;
			});
		}
	});
});

module.exports.router = router;
module.exports.group = group;
