const express = require('express');

const Connection = require('../../../connection');
const essentials = require('../essentials');

const router = express();

router.get('/', (req, res) => {
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		if(req.query.type){
			connection.execute("SELECT `user`, COUNT(*) as `total` FROM `post` WHERE AND `type` = ? GROUP BY `user` ORDER BY COUNT(*) DESC;", [req.query.type], res, (results) => {
				connection.response = essentials.count(results, 'user');
			});
		}else{
			connection.execute("SELECT `user`, COUNT(*) as `total` FROM `post` WHERE GROUP BY `user` ORDER BY COUNT(*) DESC;", [], res, (results) => {
				connection.response = essentials.count(results, 'user');
			});
		}
	});
});

router.get('/:user/', (req, res) => {
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		connection.execute("SELECT `type`, COUNT(*) as `total` FROM `post` WHERE `user` = ? GROUP BY `type`;", [req.params.user], res, (results) => {
			connection.response = essentials.count(results, 'type', ['poll', 'first', 'link', 'share', 'with']);
		});
	});
});

router.get('/:user/new/', (req, res) => {
	const dates = essentials.getDates(req);
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		if(req.query.type){
			connection.execute("SELECT `time` FROM `post` WHERE `user` = ? AND `time` BETWEEN ? AND ? AND `type` = ? ORDER BY `time`;", [req.params.user, dates[0], dates[1], req.query.type], res, (results) => {
				connection.response = essentials.periodify(results, 'time', dates, req.query.period);
			});
		}else{
			connection.execute("SELECT `time` FROM `post` WHERE `user` = ? AND `time` BETWEEN ? AND ? ORDER BY `time`;", [req.params.user, dates[0], dates[1]], res, (results) => {
				connection.response = essentials.periodify(results, 'time', dates, req.query.period);
			});
		}
	});
});

router.get('/:user/total/', (req, res) => {
	const dates = essentials.getDates(req);
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		if(req.query.type){
			connection.execute("SELECT `time` FROM `post` WHERE `user` = ? AND `time` BETWEEN ? AND ? AND `type` = ? ORDER BY `time`;", [req.params.user, dates[0], dates[1], req.query.type], res, (results) => {
				connection.response = essentials.periodify(results, 'time', dates, req.query.period, true);
			});
		}else{
			connection.execute("SELECT `time` FROM `post` WHERE `user` = ? AND `time` BETWEEN ? AND ? ORDER BY `time`;", [req.params.user, dates[0], dates[1]], res, (results) => {
				connection.response = essentials.periodify(results, 'time', dates, req.query.period, true);
			});
		}
	});
});

router.get('/:user/list/', (req, res) => {
	const dates = essentials.getDates(req);
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		if(req.query.type){
			connection.execute("SELECT * FROM `post` WHERE `user` = ? AND `time` BETWEEN ? AND ? AND `type` = ? ORDER BY `time`;", [req.params.user, dates[0], dates[1], req.query.type], res, (results) => {
				connection.response = results;
			});
		}else{
			connection.execute("SELECT * FROM `post` WHERE `user` = ? AND `time` BETWEEN ? AND ? ORDER BY `time`;", [req.params.user, dates[0], dates[1]], res, (results) => {
				connection.response = results;
			});
		}
	});
});

module.exports = router;
