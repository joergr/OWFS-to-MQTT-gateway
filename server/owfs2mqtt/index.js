process.title = "owfs2mqtt";
var mqttservername = 'mqtt://localhost';
var fs = require('fs')
var mqtt = require("mqtt");
require("./web.js");

module.exports = subs = {
	remove: function () {
		for (o in table.subscriptions) {
			client.unsubscribe(o)
		}
	},
	add: function () {
		for (o in table.subscriptions) {
			client.subscribe(o)
		}
	},
	connect: function () {
		client = mqtt.connect(mqttservername);
	},
	disconnect: function () {
		client.disconnect();
	}
}
//----------- MQTT ---------------------
var client = mqtt.connect(mqttservername)

client.on('connect', function () {
	console.log("Connected to MQTT")
		subs.add(o)
})

client.on('disconnect', function () {
	console.log("Disconnected from MQTT");
})

client.on('message', function (_topic, _value) {
	var topic = _topic.toString();
	var value = _value.toString();
	//console.log(topic, value);
	for (x in table.data) if (x == topic) {
		if (table.data[x].type == 'switch') {
			if (value != table.data[x].value) {
				var fn = table.dir + table.data[x].item;
				fs.writeFile(fn, value, 'binary', function (err) {
					if (err) throw err;
				});
			}
		}
		//console.log("Received data for ", table.data[x].descr, value);
	}
});

function toMQTT(topic, value) {
	if (topic) if (client.connected) {
		client.publish(topic, value);
	}
}





function tableChange(topic, value) {
	//console.log(topic, value)
	toMQTT(topic, value);
}
var loopCount = 0;

function loop() {
	loopCount %= 20
	for (x in table.data) {
		try {
			var fn = table.dir + table.data[x].item;
			var val = fs.readFileSync(fn, 'utf8');
			if ((val != table.data[x].value) || (loopCount == 0)) {
				table.data[x].value = val;
				tableChange(table.data[x].topic, table.data[x].value)
			}
		} catch (err) { };
	}
	loopCount++;
	setTimeout(loop, 300);
}

loop();
