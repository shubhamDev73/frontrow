function objectify(objects, keys=null){
	if(!keys)
		return objects;

	var transformedObjects = [];

	objects.forEach((object) => {
		var transformed = {};
		keys.forEach((key) => {
			if(typeof key == 'object'){
				Object.keys(key).forEach((param) => {
					transformed[key[param]] = object[param];
				});
			}else
				transformed[key] = object[key];
		});
		transformedObjects.push(transformed);
	});

	return transformedObjects;
}

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

module.exports.objectify = objectify;
module.exports.getDates = getDates;
