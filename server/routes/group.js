const express = require('express');
const { spawn } = require('child_process');
const bodyParser = require("body-parser");

const Connection = require('../connection');

const python = '../data/';

const router = express();

// for application/x-www-form-urlencoded
router.use(bodyParser.urlencoded({ extended: true }));

router.get('/', (req, res) => {
	res.render('group');
});

router.post('/', (req, res) => {
	const group_name = req.body.group_name;
	const group_link = req.body.group_link;
	const group_created_on = req.body.group_created_on;

	var errors = [];

	var id = 0;

	const script = spawn('python', [python + 'group.py', group_link]);
	console.log("Executing 'group.py'.......");

	script.stdout.on('data', (data) => {
		id = Number(data.toString().replace('\r', '').replace('\n', ''));
	});

	script.stderr.on('data', (data) => {
		errors.push({
			"code": "ER_EXEC_SCRIPT_GROUP",
			"message": "Error in executing group.py",
			"errno": 304,
			"stack": data.toString(),
		});
	});

	script.on('close', (code) => {
		console.log("'group.py' execution ended");

		const connection = new Connection(errors);
		if(code == 0){
			connection.connect(() => {
				connection.queries = 1;
				var sql = "INSERT INTO `group` (`id`, `name`, `created_on`) VALUES (?, ?, convert(?, datetime));";
				var values = [id, group_name, group_created_on];
				connection.execute(sql, values, res);
			});
		}else{
			connection.terminate(res);
		}
	});
});

module.exports = router;
