var dirToJson = require('dir-to-json');

dirToJson("./", function (err, dirTree) {
	if (err) {
		throw err;
	} else {
		console.log(dirTree);
	}
});