var fs = require('fs');
var path = require('path')
var out;
var startDir = '/mnt/1wire/'

function dirTree(filename) {
	var stats = fs.lstatSync(filename),
	info = {
		id: filename,
		text: path.basename(filename),
		type: "d"
	};
	if (stats.isDirectory()) {
		info.children = fs.readdirSync(filename).map(function (child) {

			return dirTree(path.join(filename, child));
		});
	} else {
		info.icon = "jstree-file";
		info.type = "f";
	}
	return info;
}

function test(startDir) {
	var result = [{id: startDir, text: "Onwire devices", type: 'd', children:[]}];
	dirList = fs.readdirSync(startDir);
	dirList.forEach(function (file) {
		file = path.resolve(startDir,file);
		var stat = fs.statSync(file)
		if (stat && stat.isDirectory()) {
			if (file.substr(startDir.length+2,1) == '.')
			result[0].children.push(dirTree(file))
		}
	})
	return result;
}


console.log(test(startDir))