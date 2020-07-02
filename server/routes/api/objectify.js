function transformObject(objects, params){
	var transformedObjects = [];
	objects.forEach((object) => {
		var transformed = {};
		params.forEach((param) => {
			if(typeof param == 'object'){
				Object.keys(param).forEach((key) => {
					transformed[param[key]] = object[key];
				});
			}else
				transformed[param] = object[param];
		});
		transformedObjects.push(transformed);
	});
	return transformedObjects;
}

module.exports = transformObject;
