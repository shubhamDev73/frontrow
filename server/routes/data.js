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
		connection.execute("SELECT * FROM `group`", [], null, (results) => {
			res.render('data', {'groups': results});
		});
	});
});

router.post('/posts/', upload.single('posts_file'), (req, res) => {
	const group = Number(req.body.group);
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
						connection.execute("SELECT `id` FROM `post` WHERE `id` = ? AND `group` = ?", [post['id'], group], res, (results) => {
							if(results.length == 0){
								// post not found. inserting
								var sql = "INSERT INTO `post` (`id`, `group`, `user`, `time`, `type`, `text`, `likes`, `shares`) VALUES (?, ?, ?, convert(?, datetime), ?, ?, ?, ?);";
								var values = [post['id'], group, post['user'], post['time'], post['type'], post['text'], post['likes'], post['shares']];
								connection.execute(sql, values, res, comment);
							}else{
								// post found. updating
								var sql = "UPDATE `post` SET `user` = ?, `time` = ?, `type` = ?, `text` = ?, `likes` = ?, `shares` = ? WHERE `id` = ? AND `group` = ?;";
								var values = [post['user'], post['time'], post['type'], post['text'], post['likes'], post['shares'], post['id'], group];
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
	const group = Number(req.body.group);
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
					connection.queries = 1 + 6 * users.length;
					connection.execute("SELECT `user` FROM `member` WHERE `group` = ? AND `leave_time` IS NULL;", [group], res, (results) => {
						var existing_users = results.map((result) => {return result.user});
						users.forEach((user) => {

							const index = existing_users.indexOf(user['id'])
							if(index >= 0)
								existing_users.splice(index, 1);

							// inserting/updating member
							const member = (results) => {
								var sql = "SELECT `id`, `member_type` FROM `member` WHERE `user` = ? AND `group` = ? AND `leave_time` IS NULL;";
								var values = [user['id'], group];
								connection.execute(sql, values, res, (results) => {
									if(results.length == 0){
										// user not a member. inserting
										sql = "INSERT INTO `member` (`user`, `group`, `join_time`, `member_type`)\
										VALUES (?, ?, convert(?, datetime), ?)";
										values = [user['id'], group, user['join_time'], user['type']];
										connection.execute(sql, values, res, (results) => {
											if(user['type'] == "member"){
												connection.execute(null, null, res);
											}else{
												sql = "INSERT INTO `special_member` (`member`, `join_time`, `member_type`)\
												VALUES (?, convert(?, datetime), ?)";
												values = [results.insertId, user['join_time'], user['type']];
												connection.execute(sql, values, res);
											}
											connection.execute(null, null, res);
										});
									}else{
										// user already a member
										if(results[0].member_type != user['type']){
											// member type changed. inserting/updating+inserting special_member
											const member_id = results[0].id;
											sql = "SELECT `id` FROM `special_member` WHERE `member` = ? AND `leave_time` IS NULL;";
											connection.execute(sql, [member_id], res, (results) => {
												if(results.length == 0){
													// special_member not found. inserting
													sql = "INSERT INTO `special_member` (`member`, `join_time`, `member_type`) VALUES (?, convert(?, datetime), ?);";
													values = [member_id, new Date(), user['type']];
													connection.execute(sql, values, res, (results) => {
														// updating member member_type
														sql = "UPDATE `member` SET `member_type` = ? WHERE `id` = ?;";
														values = [user['type'], member_id];
														connection.execute(sql, values, res);
														connection.execute(null, null, res);
													});
												}else{
													// special_member found. updating
													sql = "UPDATE `special_member` SET `leave_time` = convert(?, datetime) WHERE `id` = ?;";
													values = [new Date(), results[0].id];
													connection.execute(sql, values, res, (results) => {
														// inserting new special_member
														sql = "INSERT INTO `special_member` (`member`, `join_time`, `member_type`) VALUES (?, convert(?, datetime), ?);";
														values = [member_id, new Date(), user['type']];
														connection.execute(sql, values, res, (results) => {
															// updating member member_type
															sql = "UPDATE `member` SET `member_type` = ? WHERE `id` = ?;";
															values = [user['type'], member_id];
															connection.execute(sql, values, res);
														});
													});
												}
											});
										}else{
											connection.execute(null, null, res);
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
									connection.execute(sql, values, res, member);
								}else{
									// user found. updating
									var sql = "UPDATE `user` SET `name` = ?, `is_page` = ?, `join_time` = ?, `friends` = ?, `groups` = ?, `lives` = ?, `work` = ?, `study` = ? WHERE `id` = ?";
									var values = [user['name'], user['is_page'], user['join_time'], user['friends'], user['groups'], user['lives'], user['work'], user['study'], user['id']];
									connection.execute(sql, values, res, member);
								}
							});
						});
						connection.queries += existing_users.length;
						existing_users.forEach((user) => {
							connection.execute("UPDATE `member` SET `leave_time` = convert(?, datetime) WHERE `user` = ? AND `group` = ? AND `leave_time` IS NULL;", [new Date(), user, group], res);
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
	const group = Number(req.body.group);
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
							var sql = "SELECT `id` FROM `member` WHERE `user` = ? AND `group` = ? AND `leave_time` IS NULL;";
							var values = [user['id'], group];
							connection.queries += 2 * user['member']['question'].length;
							connection.execute(sql, values, res, (results) => {
								if(results.length == 1){
									const member_id = results[0].id;
									for (let j = 0; j < user['member']['question'].length; j++) {
										sql = "SELECT `id` FROM `answer` WHERE `member` = ? AND `question` = ?;";
										values = [member_id, user['member']['question'][j]];
										connection.execute(sql, values, res, (results) => {
											if(results.length == 0){
												// user's question not found. inserting
												sql = "INSERT INTO `answer` (`member`, `question`, `answer`) VALUES (?, ?, ?);";
												values = [member_id, user['member']['question'][j], user['member']['answer'][j]];
												connection.execute(sql, values, res);
											}else{
												// user's question found. updating answer
												sql = "UPDATE `answer` SET `answer` = ? WHERE `id` = ?;";
												values = [user['member']['answer'][j], results[0].id];
												connection.execute(sql, values, res);
											}
										});
									}
								}else{
									for (var j = 0; j < user['member']['question'].length; j++) {
										connection.execute(null, null, res);
										connection.execute(null, null, res);
									}
								}
							});
						};

						// inserting/updating member
						const member = (results) => {
							var sql = "SELECT `id`, `member_type` FROM `member` WHERE `user` = ? AND `group` = ? AND `leave_time` IS NULL;";
							var values = [user['id'], group];
							connection.execute(sql, values, res, (results) => {
								if(results.length == 0){
									// user not a member. inserting
									sql = "INSERT INTO `member` (`user`, `group`, `join_time`)\
									VALUES (?, ?, convert(?, datetime), ?)";
									values = [user['id'], group, user['member']['join_time']];
									connection.execute(sql, values, res, answer);
									connection.execute(null, null, res);
								}else{
									// user already a member
									connection.execute(null, null, res, answer);
									connection.execute(null, null, res);
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
								connection.execute(sql, values, res, member);
							}else{
								// user found. updating
								var sql = "UPDATE `user` SET `name` = ?, `is_page` = ?, `join_time` = ?, `friends` = ?, `groups` = ?, `lives` = ?, `work` = ?, `study` = ? WHERE `id` = ?";
								var values = [user['name'], user['is_page'], user['join_time'], user['friends'], user['groups'], user['lives'], user['work'], user['study'], user['id']];
								connection.execute(sql, values, res, member);
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
