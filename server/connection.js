const mysql = require('mysql');

class Connection{
	constructor(response=[]){
		this.connection = mysql.createConnection({
			host: 'localhost',
			user: 'root',
			password: 'admin',
			database: 'frontrow',
			charset: 'utf8mb4',
		});
		this.response = response;
		this.queries = 0;
	}

	connect(callback){
		this.connection.connect((err) => {
			if(err) console.log(err);
			else{
				console.log("Connected to database with id: " + this.connection.threadId);
				return callback();
			}
		});
	}

	execute(sql, values, res=null, callback=null){
		if(sql == null){
			return this.terminate(res, callback);
		}else{
			this.connection.query(sql, values, (err, results, fields) => {
				if(err) this.response.push(err);
				return this.terminate(res, callback, results);
			});
		}
	}

	terminate(res=null, callback=null, results=null){
		if(callback) callback(results);
		this.queries--;
		if(this.queries <= 0){
			if(this.connection._connectCalled){
				this.connection.end();
				console.log("Database connection terminated of id: " + this.connection.threadId);
			}
			if(res) res.json(this.response);
		}
	}
}

module.exports = Connection;
