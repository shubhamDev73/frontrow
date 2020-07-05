function getDates(req){
	var dates = [new Date(), new Date()]; // [start_date, end_date]

	if(req.query.end_date)
		dates[1] = new Date(req.query.end_date);

	if(req.query.start_date)
		dates[0] = new Date(req.query.start_date);
	else{
		dates[0] = new Date(dates[1]);
		dates[0].setDate(dates[1].getDate() - 1);
	}

	return dates;
}

module.exports.getDates = getDates;
