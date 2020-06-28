const express = require('express');
const mysql = require('mysql');
const { spawn } = require('child_process');
const bodyParser = require("body-parser");

const python = '../data/';

const router = express();

// for application/x-www-form-urlencoded
router.use(bodyParser.urlencoded({ extended: true }));

var queries = 0;
var errors = [];

router.get('/', (req, res) => {
	console.log("GET " + req.originalUrl);
	res.render('community');
});

router.post('/', (req, res) => {
	console.log("POST " + req.originalUrl);
	const community_name = req.body.community_name;
	const community_link = req.body.community_link;
	const community_created_on = req.body.community_created_on;

	res.setHeader('Content-type', 'text/json');

	errors = [];
	queries = 1;

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
		if(code == 0){
			connect(() => {
				var sql = "INSERT INTO `community` (`id`, `name`, `created_on`) VALUES (?, ?, convert(?, datetime));";
				var values = [id, community_name, community_created_on];
				execute(sql, values, res);
			});
		}else{
			execute(null, null, res);
		}
	});
});

var connection = null;

function connect(callback){
	connection = mysql.createConnection({
		host: 'localhost',
		user: 'root',
		password: 'admin',
		database: 'frontrow',
	});
	connection.connect((err) => {
		if(err) console.log(err);
		else{
			console.log('Connected to database as id ' + connection.threadId);
			connection.query("SET NAMES utf8mb4;", (err, results, fields) => {
				if(err) console.log(err);
				else return callback();
			});
		}
	});
}

function execute(sql, values, res=null, callback=null){
	if(sql == null){
		queries--;
		if(queries <= 0){
			if(connection){
				connection.end();
				console.log("Database connection terminated");
				connection = null;
			}
			if(res) res.end(JSON.stringify(errors, null, 4));
		}
		if(callback) return callback(null);
	}else{
		connection.query(sql, values, (err, results, fields) => {
			queries--;
			if(err) errors.push(err);
			if(queries <= 0){
				if(connection){
					connection.end();
					console.log("Database connection terminated");
					connection = null;
				}
				if(res) res.end(JSON.stringify(errors, null, 4));
			}
			if(callback) return callback(results);
		});
	}
}

module.exports = router;
