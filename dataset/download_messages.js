async function fetch_all_messages(token, channel_id, callback = null, limit = null) {
	var more = true;
	var messages = [];
	var num_messages = 0;
	var last_message_id = null;

	while (more) {
		var response = await fetch(`https://discord.com/api/v9/channels/${channel_id}/messages?limit=100${last_message_id ? ("&before=" + last_message_id) : ""}`, {
			headers: {
				"Authorization": `${token}`,
			}
		});

		if (response.status != 200) {
			console.log(`Error fetching messages: ${response.status}`);
			console.log(await response.text());
			continue;
		}

		var data = await response.json();

		for (var i = 0; i < data.length; i++) {
			messages.push(data[i].content);
			num_messages++;
		}

		console.log(`${data.length} messages fetched. Fetched from ${last_message_id} to ${ data[data.length - 1].id}! Fetched ${num_messages} messages total!`);

		last_message_id = data[data.length - 1].id;

		if (data.length < 100) {
			more = false;
		}

		if (limit && num_messages >= limit) {
			more = false;
		}

		if (callback) {
			callback(data.map(x => x.content), num_messages, limit);
		}
	}

	return messages;
}

async function main() {
	var token = prompt("Enter your discord token: ");

	var channels = JSON.parse(Deno.readTextFileSync("config.json")).channels;

	try {
		if (!Deno.lstatSync("output").isDirectory) {
			Deno.mkdirSync("output");
		}
	} catch (e) {
		Deno.mkdirSync("output");
	}

	for (var i = 0; i < channels.length; i++) {
		var messages = await fetch_all_messages(token, channels[i]);
		Deno.writeTextFileSync(`./output/${channels[i]}.txt`, messages.reverse().join("\n"));
	}
}

main();