const express = require('express');
const { spawn } = require('child_process');
const bodyParser = require("body-parser");
const fs = require('fs');
const multer = require('multer');

const Connection = require('../connection');

const destination = './uploads/';
const python = '../data/';

const router = express();

// for application/x-www-form-urlencoded
router.use(bodyParser.urlencoded({ extended: true }));

// for multipart/form-data
const storage = multer.diskStorage({
	destination: destination,
	filename: (req, file, cb) => {
		cb(null, file.fieldname.split('_')[0] + '.txt');
	}
});
const upload = multer({storage: storage});

router.get('/', (req, res) => {
	const connection = new Connection();
	connection.connect(() => {
		connection.queries = 1;
		connection.execute("SELECT * FROM `community`", [], null, (results) => {
			res.render('data', {'communities': results});
		});
	});
});

router.post('/posts/', upload.single('posts_file'), (req, res) => {
	const community = Number(req.body.community);
	const number = Number(req.body.posts_number);

	var errors = [];

	const script = spawn('python', [python + 'posts.py', destination + 'posts.txt', destination + 'posts.json', number]);
	console.log("Executing 'posts.py'.......");

	script.stdout.on('data', (data) => {
		data.toString().split('\r\n').forEach((line) => {if(line) console.log("-> " + line);});
	});

	script.stderr.on('data', (data) => {
		errors.push({
			"code": "ER_EXEC_SCRIPT_POSTS",
			"message": "Error in executing posts.py",
			"errno": 301,
			"stack": data.toString(),
		});
	});

	script.on('close', (code) => {
		console.log("'posts.py' execution ended");
		fs.unlink(destination + 'posts.txt', (err) => {
			if(err) console.log(err);
			else console.log("Deleted: " + destination + 'posts.txt');
		});

		const connection = new Connection(errors);
		if(code == 0){
			fs.readFile(destination + 'posts.json', 'utf8', (err, data) => {
				fs.unlink(destination + 'posts.json', (err) => {
					if(err) console.log(err);
					else console.log("Deleted: " + destination + 'posts.json');
				});

				connection.connect(() => {
					const posts = JSON.parse(data);
					connection.queries = 2 * posts.length;
					posts.forEach((post) => {

						if(post['error']){
							errors.push({
								"code": "ER_ANALYSE_POST",
								"message": post['error'],
								"errno": 401,
								"post": post,
							});
							connection.queries -= 2;
							return;
						}
						connection.queries += 2 * post['comments'].length;

						// inserting/updating comment
						const comment = (results) => {

							post['comments'].forEach((comment) => {

								if(comment['error']){
									errors.push({
										"code": "ER_ANALYSE_COMMENT",
										"message": comment['error'],
										"errno": 402,
										"post": post,
										"comment": comment,
									});
									connection.queries -= 2;
									return;
								}
								connection.queries += 2 * comment['replies'].length;

								// inserting/updating reply
								const reply = (results) => {
									comment['replies'].forEach((reply) => {

										if(reply['error']){
											errors.push({
												"code": "ER_ANALYSE_REPLY",
												"message": reply['error'],
												"errno": 403,
												"post": post,
												"comment": comment,
												"reply": reply,
											});
											connection.queries -= 2;
											return;
										}

										connection.execute("SELECT `id` FROM `comment` WHERE `id` = ? AND `comment` = ?", [reply['id'], comment['id']], res, (results) => {
											if(results.length == 0){
												// reply not found. inserting
												var sql = "INSERT INTO `comment` (`id`, `post`, `comment`, `user`, `time`, `text`, `likes`) VALUES (?, ?, ?, ?, convert(?, datetime), ?, ?);";
												var values = [reply['id'], post['id'], comment['id'], reply['user'], reply['time'], reply['text'], reply['likes']];
												connection.execute(sql, values, res);
											}else{
												// reply found. updating
												var sql = "UPDATE `comment` SET `user` = ?, `time` = ?, `text` = ?, `likes` = ? WHERE `id` = ? AND `post` = ? AND `comment` = ?;";
												var values = [reply['user'], reply['time'], reply['text'], reply['likes'], reply['id'], post['id'], comment['id']];
												connection.execute(sql, values, res);
											}
										});
									});
								};

								connection.execute("SELECT `id` FROM `comment` WHERE `id` = ? AND `post` = ?", [comment['id'], post['id']], res, (results) => {
									if(results.length == 0){
										// comment not found. inserting
										var sql = "INSERT INTO `comment` (`id`, `post`, `user`, `time`, `text`, `likes`) VALUES (?, ?, ?, convert(?, datetime), ?, ?);";
										var values = [comment['id'], post['id'], comment['user'], comment['time'], comment['text'], comment['likes']];
										connection.execute(sql, values, res, reply);
									}else{
										// comment found. updating
										var sql = "UPDATE `comment` SET `user` = ?, `time` = ?, `text` = ?, `likes` = ? WHERE `id` = ? AND `post` = ?;";
										var values = [comment['user'], comment['time'], comment['text'], comment['likes'], comment['id'], post['id']];
										connection.execute(sql, values, res, reply);
									}
								});
							});
						};

						// inserting/updating post
						connection.execute("SELECT `id` FROM `post` WHERE `id` = ? AND `community` = ?", [post['id'], community], res, (results) => {
							if(results.length == 0){
								// post not found. inserting
								var sql = "INSERT INTO `post` (`id`, `community`, `user`, `time`, `type`, `text`, `likes`, `shares`) VALUES (?, ?, ?, convert(?, datetime), ?, ?, ?, ?);";
								var values = [post['id'], community, post['user'], post['time'], post['type'], post['text'], post['likes'], post['shares']];
								connection.execute(sql, values, res, comment);
							}else{
								// post found. updating
								var sql = "UPDATE `post` SET `user` = ?, `time` = ?, `type` = ?, `text` = ?, `likes` = ?, `shares` = ? WHERE `id` = ? AND `community` = ?;";
								var values = [post['user'], post['time'], post['type'], post['text'], post['likes'], post['shares'], post['id'], community];
								connection.execute(sql, values, res, comment);
							}
						});
					});
				});
			});
		}else{
			connection.terminate(res);
		}
	});
});

router.post('/members/', upload.single('members_file'), (req, res) => {
	const community = Number(req.body.community);
	const number = Number(req.body.members_number);

	var errors = [];

	const script = spawn('python', [python + 'members.py', destination + 'members.txt', destination + 'members.json', number]);
	console.log("Executing 'members.py'.......");

	script.stdout.on('data', (data) => {
		data.toString().split('\r\n').forEach((line) => {if(line) console.log("-> " + line);});
	});

	script.stderr.on('data', (data) => {
		errors.push({
			"code": "ER_EXEC_SCRIPT_MEMBERS",
			"message": "Error in executing members.py",
			"errno": 302,
			"stack": data.toString(),
		});
	});

	script.on('close', (code) => {
		console.log("'members.py' execution ended");
		fs.unlink(destination + 'members.txt', (err) => {
			if(err) console.log(err);
			else console.log("Deleted: " + destination + 'members.txt');
		});

		const connection = new Connection(errors);
		if(code == 0){
			fs.readFile(destination + 'members.json', 'utf8', (err, data) => {
				fs.unlink(destination + 'members.json', (err) => {
					if(err) console.log(err);
					else console.log("Deleted: " + destination + 'members.json');
				});

				connection.connect(() => {
					const users = JSON.parse(data);
					connection.queries = 1 + 5 * users.length;
					connection.execute("SELECT `user` FROM `activity` WHERE `community` = ? AND `leave_time` IS NULL;", [community], res, (results) => {
						var existing_users = results.map((result) => {return result.user});
						users.forEach((user) => {

							const index = existing_users.indexOf(user['id'])
							if(index >= 0)
								existing_users.splice(index, 1);

							// inserting/updating activity
							const activity = (results) => {
								var sql = "SELECT `user_type` FROM `activity` WHERE `user` = ? AND `community` = ? AND `leave_time` IS NULL;";
								var values = [user['id'], community];
								connection.execute(sql, values, res, (results) => {
									if(results.length == 0){
										// user not present in group activity. inserting
										sql = "INSERT INTO `activity` (`user`, `community`, `join_time`, `user_type`)\
										VALUES (?, ?, convert(?, datetime), ?)";
										values = [user['id'], community, user['join_time'], user['type']];
										connection.execute(sql, values, res);
										connection.execute(null, null, res);
									}else{
										// user present in group activity
										if(results[0].user_type != user['type']){
											// user type changed. updating
											sql = "UPDATE `activity` SET `leave_time` = convert(?, datetime) WHERE `user` = ? AND `community` = ?;";
											values = [new Date(), user['id'], community];
											connection.execute(sql, values, res, (results) => {
												// creating new activity with new user_type
												sql = "INSERT INTO `activity` (`user`, `community`, `join_time`, `user_type`)\
												VALUES (?, ?, convert(?, datetime), ?)";
												values = [user['id'], community, new Date(), user['type']];
												connection.execute(sql, values, res);
											});
										}else{
											connection.execute(null, null, res);
											connection.execute(null, null, res);
										}
									}
								});
							};

							// inserting/updating user
							connection.execute("SELECT `id` FROM `user` WHERE `id` = ?", [user['id']], res, (results) => {
								if(results.length == 0){
									// user not found. inserting
									var sql = "INSERT INTO `user` (`id`, `name`, `is_page`, `join_time`, `friends`, `groups`, `lives`, `work`, `study`)\
									VALUES (?, ?, ?, convert(?, datetime), ?, ?, ?, ?, ?)";
									var values = [user['id'], user['name'], user['is_page'], user['join_time'], user['friends'], user['groups'], user['lives'], user['work'], user['study']];
									connection.execute(sql, values, res, activity);
								}else{
									// user found. updating
									var sql = "UPDATE `user` SET `name` = ?, `is_page` = ?, `join_time` = ?, `friends` = ?, `groups` = ?, `lives` = ?, `work` = ?, `study` = ? WHERE `id` = ?";
									var values = [user['name'], user['is_page'], user['join_time'], user['friends'], user['groups'], user['lives'], user['work'], user['study'], user['id']];
									connection.execute(sql, values, res, activity);
								}
							});
						});
						connection.queries += existing_users.length;
						existing_users.forEach((user) => {
							connection.execute("UPDATE `activity` SET `leave_time` = convert(?, datetime) WHERE `user` = ? AND `community` = ? AND `leave_time` IS NULL;", [new Date(), user, community], res);
						});
					});
				});
			});
		}else{
			connection.terminate(res);
		}
	});
});

router.post('/requests/', upload.single('requests_file'), (req, res) => {
	const community = Number(req.body.community);
	const number = Number(req.body.requests_number);

	var errors = [];

	const script = spawn('python', [python + 'member_requests.py', destination + 'requests.txt', destination + 'requests.json', number]);
	console.log("Executing 'member_requests.py'.......");

	script.stdout.on('data', (data) => {
		data.toString().split('\r\n').forEach((line) => {if(line) console.log("-> " + line);});
	});

	script.stderr.on('data', (data) => {
		errors.push({
			"code": "ER_EXEC_SCRIPT_MEMBER_REQUESTS",
			"message": "Error in executing member_requests.py",
			"errno": 303,
			"stack": data.toString(),
		});
	});

	script.on('close', (code) => {
		console.log("'member_requests.py' execution ended");
		fs.unlink(destination + 'requests.txt', (err) => {
			if(err) console.log(err);
			else console.log("Deleted: " + destination + 'requests.txt');
		});

		const connection = new Connection(errors);
		if(code == 0){
			fs.readFile(destination + 'requests.json', 'utf8', (err, data) => {
				fs.unlink(destination + 'requests.json', (err) => {
					if(err) console.log(err);
					else console.log("Deleted: " + destination + 'requests.json');
				});

				connection.connect(() => {
					const users = JSON.parse(data);
					connection.queries = 6 * users.length;
					users.forEach((user) => {

						// inserting/updating answers
						const answer = (results) => {
							var sql = "SELECT `id` FROM `activity` WHERE `user` = ? AND `community` = ? AND `leave_time` IS NULL;";
							var values = [user['id'], community];
							connection.queries += 2 * user['activity']['question'].length;
							connection.execute(sql, values, res, (results) => {
								if(results.length == 1){
									const activity_id = results[0].id;
									for (let j = 0; j < user['activity']['question'].length; j++) {
										sql = "SELECT `id` FROM `answer` WHERE `activity` = ? AND `question` = ?;";
										values = [activity_id, user['activity']['question'][j]];
										connection.execute(sql, values, res, (results) => {
											if(results.length == 0){
												// user's question not found. inserting
												sql = "INSERT INTO `answer` (`activity`, `question`, `answer`) VALUES (?, ?, ?);";
												values = [activity_id, user['activity']['question'][j], user['activity']['answer'][j]];
												connection.execute(sql, values, res);
											}else{
												// user's question found. updating answer
												sql = "UPDATE `answer` SET `answer` = ? WHERE `id` = ?;";
												values = [user['activity']['answer'][j], results[0].id];
												connection.execute(sql, values, res);
											}
										});
									}
								}else{
									for (var j = 0; j < user['activity']['question'].length; j++) {
										connection.execute(null, null, res);
										connection.execute(null, null, res);
									}
								}
							});
						};

						// inserting/updating activity
						const activity = (results) => {
							var sql = "SELECT `user_type` FROM `activity` WHERE `user` = ? AND `community` = ? AND `leave_time` IS NULL;";
							var values = [user['id'], community];
							connection.execute(sql, values, res, (results) => {
								if(results.length == 0){
									// user not present in group activity. inserting
									sql = "INSERT INTO `activity` (`user`, `community`, `join_time`, `user_type`)\
									VALUES (?, ?, convert(?, datetime), ?)";
									values = [user['id'], community, user['activity']['join_time'], user['type']];
									connection.execute(sql, values, res, answer);
									connection.execute(null, null, res);
								}else{
									// user present in group activity
									if(results[0].user_type != user['type']){
										// user type changed. updating
										sql = "UPDATE `activity` SET `leave_time` = convert(?, datetime) WHERE `user` = ? AND `community` = ?;";
										values = [new Date(), user['id'], community];
										connection.execute(sql, values, res, (results) => {
											// creating new activity with new user_type
											sql = "INSERT INTO `activity` (`user`, `community`, `join_time`, `user_type`)\
											VALUES (?, ?, convert(?, datetime), ?)";
											values = [user['id'], community, new Date(), user['type']];
											connection.execute(sql, values, res, answer);
										});
									}else{
										connection.execute(null, null, res, answer);
										connection.execute(null, null, res);
									}
								}
							});
						};

						// inserting/updating user
						connection.execute("SELECT `id` FROM `user` WHERE `id` = ?", [user['id']], res, (results) => {
							if(results.length == 0){
								// user not found. inserting
								var sql = "INSERT INTO `user` (`id`, `name`, `is_page`, `join_time`, `friends`, `groups`, `lives`, `work`, `study`)\
								VALUES (?, ?, ?, convert(?, datetime), ?, ?, ?, ?, ?)";
								var values = [user['id'], user['name'], user['is_page'], user['join_time'], user['friends'], user['groups'], user['lives'], user['work'], user['study']];
								connection.execute(sql, values, res, activity);
							}else{
								// user found. updating
								var sql = "UPDATE `user` SET `name` = ?, `is_page` = ?, `join_time` = ?, `friends` = ?, `groups` = ?, `lives` = ?, `work` = ?, `study` = ? WHERE `id` = ?";
								var values = [user['name'], user['is_page'], user['join_time'], user['friends'], user['groups'], user['lives'], user['work'], user['study'], user['id']];
								connection.execute(sql, values, res, activity);
							}
						});
					});
				});
			});
		}else{
			connection.terminate(res);
		}
	});
});

module.exports = router;
