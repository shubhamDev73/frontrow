function getDates(req){
	var dates = [new Date(0), new Date()]; // [start_date, end_date] defaults

	if(req.query.end_date)
		dates[1] = new Date(req.query.end_date);

	if(req.query.start_date)
		dates[0] = new Date(req.query.start_date);

	dates[0].setUTCHours(0);
	dates[0].setUTCMinutes(0);
	dates[0].setUTCSeconds(0);
	dates[0].setUTCMilliseconds(0);
	dates[1].setUTCHours(0);
	dates[1].setUTCMinutes(0);
	dates[1].setUTCSeconds(0);
	dates[1].setUTCMilliseconds(0);

	return dates;
}

function periodify(results, key, dates, period, retain, unique_users){
	var perioded_results = [];

	if(period == undefined) period = 1; // default period
	if(typeof period == 'string') period = Number(period);

	if(retain == undefined) retain = false;
	if(unique_users == undefined) unique_users = false;

	if(results.length == 0){
		if(dates[0].valueOf() == 0) return results;

		// adding zeroes till end
		var date = new Date(dates[0]);
		perioded_results.push({'date': new Date(date), 'count': 0});
		while(date < dates[1]){
			date.setDate(date.getDate() + period);
			perioded_results.push({'date': new Date(date), 'count': 0});
		}
		return perioded_results;
	}

	var current_date = dates[0].valueOf() == 0 ? results[0][key] : dates[0]; // default start date
	var count = 0;
	var setCount = dates[0].valueOf() == 0;
	var users = [];

	// counting for each result
	results.forEach((result) => {
		const diff = (result[key] - current_date) / (1000 * 60 * 60 * 24);
		if(diff > period){
			perioded_results.push({'date': current_date, 'count': count});

			// adding missing intervals
			var date = new Date(current_date);
			date.setDate(date.getDate() + period);
			while((result[key] - date) / (1000 * 60 * 60 * 24) > period){
				perioded_results.push({'date': new Date(date), 'count': retain ? count : 0});
				date.setDate(date.getDate() + period);
			}
			current_date = date;
			count = retain ? count + 1 : 1;
			setCount = true;
			users = [result['user']];
		}else{
			if((setCount || retain) && (!unique_users || users.indexOf(result['user']) < 0)){
				count++;
				users.push(result['user']);
			}
		}
	});

	// adding last result
	var date = new Date(perioded_results.length == 0 ? current_date : perioded_results[perioded_results.length - 1]['date']);
	date.setDate(date.getDate() + period);
	perioded_results.push({'date': new Date(date), 'count': count});

	// adding intervals upto end date
	while(date < dates[1]){
		date.setDate(date.getDate() + period);
		perioded_results.push({'date': new Date(date), 'count': retain ? count : 0});
	}

	// removing left members for retain (present members)
	if(retain && Object.keys(results[0]).indexOf('leave_time') >= 0){
		results.forEach((result) => {
			if(result['leave_time']){
				for(var i = 0; i < perioded_results.length; i++){
					if((result['leave_time'] - perioded_results[i]['date']) / (1000 * 60 * 60 * 24) < period)
						perioded_results[i]['count']--;
				}
			}
		});
	}

	return perioded_results;
}

function count(results, param, keys=null){
	var counts = {};
	var total = 0;
	results.forEach((result) => {
		if(!keys || keys.indexOf(result[param]) >= 0)
			counts[result[param]] = result['total'];
		total += result['total'];
	});

	if(keys){
		keys.forEach((key) => {
			if(Object.keys(counts).indexOf(key) < 0)
				counts[key] = 0;
		});
	}

	counts['total'] = total;

	return counts;
}

module.exports.getDates = getDates;
module.exports.periodify = periodify;
module.exports.count = count;
