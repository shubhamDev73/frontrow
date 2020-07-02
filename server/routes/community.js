const express = require('express');
const { spawn } = require('child_process');
const bodyParser = require("body-parser");

const Connection = require('../connection');

const python = '../data/';

const router = express();

// for application/x-www-form-urlencoded
router.use(bodyParser.urlencoded({ extended: true }));

router.get('/', (req, res) => {
	res.render('community');
});

router.post('/', (req, res) => {
	const community_name = req.body.community_name;
	const community_link = req.body.community_link;
	const community_created_on = req.body.community_created_on;

	var errors = [];

	var id = 0;

	const script = spawn('python', [python + 'community.py', community_link]);
	console.log("Executing 'community.py'.......");

	script.stdout.on('data', (data) => {
		id = Number(data.toString().split('\r\n')[0]);
	});

	script.stderr.on('data', (data) => {
		errors.push({
			"code": "ER_EXEC_SCRIPT_COMMUNITY",
			"message": "Error in executing community.py",
			"errno": 304,
			"stack": data.toString(),
		});
	});

	script.on('close', (code) => {
		console.log("'community.py' execution ended");

		const connection = new Connection(errors);
		if(code == 0){
			connection.connect(() => {
				connection.queries = 1;
				var sql = "INSERT INTO `community` (`id`, `name`, `created_on`) VALUES (?, ?, convert(?, datetime));";
				var values = [id, community_name, community_created_on];
				connection.execute(sql, values, res);
			});
		}else{
			connection.terminate(res);
		}
	});
});

module.exports = router;
