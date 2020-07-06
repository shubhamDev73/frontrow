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
				connection.response = essentials.periodify(results, 'time', dates, false, req.query.period);
			});
		}else{
			connection.execute("SELECT `time` FROM `post` WHERE `group` = ? AND `time` BETWEEN ? AND ? ORDER BY `time`;", [group.id, dates[0], dates[1]], res, (results) => {
				connection.response = essentials.periodify(results, 'time', dates, false, req.query.period);
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
				connection.response = essentials.periodify(results, 'time', dates, true, req.query.period);
			});
		}else{
			connection.execute("SELECT `time` FROM `post` WHERE `group` = ? AND `time` BETWEEN ? AND ? ORDER BY `time`;", [group.id, dates[0], dates[1]], res, (results) => {
				connection.response = essentials.periodify(results, 'time', dates, true, req.query.period);
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

module.exports.router = router;
module.exports.group = group;
