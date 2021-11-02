var channels = JSON.parse(Deno.readTextFileSync("config.json")).channels;

var dataset = [];

channels.forEach(function(channel) {
	console.log("Loading channel " + channel);

	var data = Deno.readTextFileSync(`./output/${channel}.txt`);
	var data_split = data.toString().split("\n");
	data_split.forEach(function(line) {
		dataset.push(line);
	});
});

console.log(`There are ${dataset.length} lines in the dataset.`);

Deno.writeTextFileSync("./dataset.txt", dataset.join("\n"));