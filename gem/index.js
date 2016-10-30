process.title = "owfs2mqtt";
port = 8087;
defaulthtml = "/index.html";
webdir = __dirname + '';
var datadir = "data";
var dirdir = "/mnt/1wire/bus.0/bus.1/";
var http = require('http');
var url = require("url");
var path = require("path");
var fs = require('fs')
var util = require('util');
var web = require("web-server");
var mqttservername = 'mqtt://localhost';
var mqtt = require("mqtt");
var encoding = require('encoding');

var client = mqtt.connect(mqttservername)

var tabledir = "data";
var tablefile = "table.data";
var tablefilename = tabledir + "/" + tablefile;
var table = {
	subscribe: "onewire/",
	dir: "/mnt/1wire/bus.0/bus.1/",
	data: {}
}
var descr;
var topic;
var item;
var errtext;

if (!fs.existsSync(tabledir)) fs.mkdirSync(tabledir);

try {
	var s = fs.readFileSync(tablefilename, 'binary').toString().trim()
	table = JSON.parse(s);
	console.log(s);
} catch (err) { }

function savetable() {
	fs.writeFileSync(tablefilename, JSON.stringify(table), { flag: 'w' });
}

function checkargs(args) {
	if (typeof (args.cmd) != 'undefined') {
		console.log("Deleting ", args.topic)
		delete table.data[args.topic];
		return;
	}
	if ((typeof (args.descr) == 'undefined') || (typeof (args.descr) == 'undefined') || (typeof (args.descr) == 'undefined')) {
		descr = "";
		topic = "";
		item = "";
		errtext = "";
		return;
	}
	descr = args.descr;
	topic = args.topic;
	item = args.item;
	if ((descr == "") || (topic == "") || (item == "")) errtext = "Error: some fields are missing!";
	else {
		errtext = "";
		table.data[topic] = { descr: descr, topic: topic, item: item };
		//console.log(table)
		var options = { flag: 'w' };
		var s = JSON.stringify(table);
		fs.writeFile(tablefilename, s, 'binary', options, function (err) {
			if (err) throw err;
			descr = "";
			topic = "";
			item = "";
			errtext = "";
			console.log('file saved');
		});
	}
};

function makeTab() {
	var tab = "";
	for (x in table.data) {
		tab += ("<tr>");
		tab += ("<td>" + table.data[x].item + "</td>");
		tab += ("<td>" + table.data[x].topic + "</td>");
		tab += ("<td>" + table.data[x].descr + "</td>");
		tab += ("<td><button onclick='clickDelete(\"" + x + "\");' >Delete</button></td><td></td>");
		tab += ("</tr>");
	}
	return tab;
}

function makePage(content) {
	var dir = "var dir = [" + util.inspect(dirTree(dirdir), false, null) + "];";
	content = content.replace("/*DIR*/", dir);
	content = content.replace("%%DESC%%", descr)
	content = content.replace("%%ITEM%%", item)
	content = content.replace("%%TOPIC%%", topic)
	content = content.replace("%%ERR%%", errtext)
	content = content.replace("<!--LIST-->", makeTab());
	return content;
};

server = web.create(defaulthtml, webdir, port, function () {
	console.log('Now Listening on port ' + port);
}, checkargs, makePage);

function dirTree(filename) {
	var stats = fs.lstatSync(filename),
        info = {
        	id: filename,
        	text: path.basename(filename)
        };
	if (stats.isDirectory()) {
		info.children = fs.readdirSync(filename).map(function (child) {
			return dirTree(filename + '/' + child);
		});
	} else {
		info.icon = "jstree-file";
	}
	return info;
}

//----------- MQTT ---------------------

client.on('connect', function () {
	console.log("Connected to MQTT")
	client.subscribe('ow')
})

client.on('disconnect', function () {
	console.log("Disconnected from MQTT");
})

client.on('message', function (topic, value) {
	console.log(topic.toString(), value.toString());
	for (x in table.data) if (x == topic.toString()) {
		console.log("Received data for ", table.data[x].descr, value.toString());
		//	handle message
	}
	return;
	var top = "";
	var addr = "";
	var val = "";
	try {
		top = topic.toString();
		addr = topic2addr(top)
		val = value.toString();
		if (val == devices[addr].value.toString()) return;
	} catch (err) { }
	if (topic == "") return;
	if (addr == "") return;
	switch (devices[addr].role) {
		case 'STAT':
			socket.emit("limits", pin, { mode: parseInt(val) });
			break;
		case 'R1':
			socket.emit("limits", pin, { mode: 2 });
			socket.emit("update", pin, { addr: addr, value: parseInt(val) });
			break;
		case 'R2':
			socket.emit("limits", pin, { mode: 2 });
			socket.emit("update", pin, { addr: addr, value: parseInt(val) });
			break;
	}
});

function toMQTT(topic, value) {
	if (topic) if (client.connected) {
		client.publish(topic, value);
	}
}

try {
	table = fs.fileReadSync(tablefilename)
} catch (err) { }

var page = "";
