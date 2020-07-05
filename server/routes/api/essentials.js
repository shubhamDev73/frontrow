function getDates(req){
	var dates = [new Date(0), new Date()]; // [start_date, end_date]

	if(req.query.end_date)
		dates[1] = new Date(req.query.end_date);

	if(req.query.start_date)
		dates[0] = new Date(req.query.start_date);

	return dates;
}

function periodify(results, key, dates, retain, period=null){
	if(results.length == 0) return results;
	if(period == null) period = 1;
	if(typeof period == 'string') period = Number(period);

	var perioded_results = [];

	var current_date = dates[0].valueOf() == 0 ? results[0][key] : dates[0];
	var count = 0;
	var setCount = dates[0].valueOf() == 0;
	results.forEach((result) => {
		const diff = (result[key] - current_date) / (1000 * 60 * 60 * 24);
		if(diff > period){
			perioded_results.push({'date': current_date, 'count': count});
			var date = new Date(current_date);
			while((result[key] - date) / (1000 * 60 * 60 * 24) > period){
				date.setDate(date.getDate() + period);
				perioded_results.push({'date': new Date(date), 'count': retain ? count : 0});
			}
			current_date = result[key];
			count = retain ? count + 1 : 1;
			setCount = true;
		}else{
			if(setCount || retain)
				count++;
		}
	});

	var date = new Date(perioded_results.length == 0 ? current_date : perioded_results[perioded_results.length - 1]['date']);
	date.setDate(date.getDate() + period);
	perioded_results.push({'date': new Date(date), 'count': count});
	while(date < dates[1]){
		date.setDate(date.getDate() + period);
		perioded_results.push({'date': new Date(date), 'count': retain ? count : 0});
	}

	return perioded_results;
}

module.exports.getDates = getDates;
module.exports.periodify = periodify;
