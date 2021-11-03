var channels = [];

for await (const dirEntry of Deno.readDir('output')) {
	channels.push(dirEntry.name.replace(".txt", ""));
}

var dataset = [];

channels.forEach(function(channel) {
	console.log("Loading dataset " + channel);

	var data = Deno.readTextFileSync(`./output/${channel}.txt`);
	var data_split = data.toString().split("\n");
	data_split.forEach(function(line) {
		line = line.replace(/<(.*)>/g, ""); // remove pings/channel tags/nitro emotes
		line = line.trim();

		if (line != "" && line.split(" ").length >= 2) {
			dataset.push(line);
		}
	});
});

console.log(`There are ${dataset.length} lines in the dataset.`);

Deno.writeTextFileSync("./dataset.txt", dataset.join("\n"));