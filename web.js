port = 8087;
defaulthtml = "/index.html";
webdir = __dirname + '/www';
var http = require('http');
var url = require('url');
var path = require('path')
var mime = require('mime-types');
var fs = require('fs')
var tabledir = "data";
var tablefile = "table.json";
var tablefilename = tabledir + "/" + tablefile;


module.exports = table = {
	subscribe: "onewire/",
	mqtturl: 'mqtt://localhost',
	dir: "/mnt/1wire/bus.0/bus.1/",
	subscriptions: {},
	descr: "",
	topic: "",
	item: "",
	type: "",
	errtext: "",
	data: {}
}

tableReset = function () {
	with (table) {
		item = "";
		topic = "";
		descr = "";
		type = "sensor";
		errtext = "";
	}
}


dirTree = function (filename) {
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

dirList = function (startDir) {
	var result = [{ id: startDir, text: "Onwire devices", type: 'd', children: [] }];
	try {
		list = fs.readdirSync(startDir);
		list.forEach(function (file) {
			file = path.resolve(startDir, file);
			var stat = fs.statSync(file)
			if (stat && stat.isDirectory()) {
				if (file.substr(startDir.length + 2, 1) == '.') result[0].children.push(dirTree(file))
			}
		})
	} catch (err) { };
	return result;
}

makeSubscriptions = function () {
	subs.remove();
	table.subscriptions = {};
	for (x in table.data) {
		n = x.substr(0, x.indexOf("/") + 1)
		table.subscriptions[n] = 0;
	}
	subs.add();
}
savetab = function () {
	var options = { flag: 'w' };
	var s = JSON.stringify(table);
	makeSubscriptions();
	tableReset();
	fs.writeFile(tablefilename, s, 'binary', options, function (err) {
		if (err) throw err;
	});
};

handleArgs = function (args) {
	if (typeof (args.cmd) == 'undefined') return;
	switch (args.cmd) {
		case "dir":
			try {
				var list = fs.readdirSync(args.owdir);
				table.dir = args.owdir;
				savetab();
			} catch (err) {
				table.errtext = "Invalid onewire directory";
			}
			break;
		case "mqtt":
			console.log(args);
			table.mqtturl = args.mqtturl;
			break;
			savetab();
		case "clear":
			tableReset();
			break;
			savetab();
		case "delete":
			console.log("Deleting ", args.topic)
			delete table.data[args.topic];
			savetab();
			break;
		case "add":
			{
				if ((typeof (args.descr) == 'undefined') || (typeof (args.descr) == 'undefined') || (typeof (args.descr) == 'undefined')) {
					table.descr = "";
					table.topic = "";
					table.item = "";
					table.errtext = "Args missing";
					console.log("Undefined args")
					return;
				}
				table.descr = args.descr;
				table.topic = args.topic;
				table.item = args.item;
				table.type = args.type;
				if ((table.descr == "") || (table.topic == "") || (table.item == "")) {
					table.errtext = "Error: some fields are missing!";
					console.log("Invalid fields")
				} else {
					table.data[table.topic] = { descr: table.descr, topic: table.topic, item: table.item, type: table.type };
					savetab();
				}
			}
			break;
	}
}
server = http.createServer(function (req, res) {
	if (req.url == '/null') return
	var ip_address = null;
	if (req.headers['x-forwarded-for']) {
		ip_address = req.headers['x-forwarded-for'];
	}
	else {
		ip_address = req.connection.remoteAddress;
	}
	var uri = url.parse(req.url).pathname;
	var filename = webdir + (uri == '/' ? defaulthtml : uri);
	//console.log(uri);
	switch (uri) {
		case '/root.json':
			//console.log("Sending data")
			res.writeHead(200, { "Content-Type": mime.lookup(".json") });
			var ar = dirList(table.dir);
			res.write(JSON.stringify(ar));
			res.end();
			break;
		case "/table.js":
			res.writeHead(200, { "Content-Type": mime.lookup(".json") });
			res.write("\nvar table = " + JSON.stringify(table) + ";");
			res.end();
			break;
		default:
			handleArgs(url.parse(req.url, true).query);
			fs.readFile(filename, "binary", function (err, file) {
				if (err) {
					console.log("404", err)
					res.writeHead(404, { "Content-Type": mime.lookup(".txt") });
					res.write("404 Not Found\n");
					res.end();
				} else {
					var headers = {};
					var contentType = mime.lookup(filename);
					if (contentType) headers["Content-Type"] = contentType;
					res.writeHead(200, headers);
					res.write(file, "binary");
					res.end();
				}
			})
			break;
	}
}).listen(port, function () {
	console.log("server started on port ", port)
})

if (!fs.existsSync(tabledir)) fs.mkdirSync(tabledir);
fs.readFile(tablefilename, 'binary', function (err, data) {
	if (err) console.log("Using empty table", tablefilename);
	else table = JSON.parse(data.trim());
	tableReset();
	makeSubscriptions()
	//for (x in table.subscriptions) console.log(x);
	for (i in table.data) table.data[i].value == "";
})

