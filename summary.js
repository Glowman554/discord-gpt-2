import { csv } from "./csv.js";

function calculate_average_text_length(text) {
	var full_length = 0;
	
	for (var i = 0; i < text.length; i++) {
		full_length += text[i].length;
	}

	return Math.round(full_length / text.length);
}

function generate_word_list(text) {
	var word_list = [];
	
	for (var i = 0; i < text.length; i++) {
		var words = text[i].split(" ");

		words = words.map(word => word.toLowerCase());
		words = words.map(word => word.replace(/^(http|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/gm, ""));
		words = words.map(word => word.replace(/[^a-zA-Z']/g, " "));

		for (var j = 0; j < words.length; j++) {
			if (words[j] != "") {
				if (word_list.find(word => word.word == words[j]) == undefined) {
					word_list.push({
						word: words[j],
						num_occurrences: 1
					});
				} else {
					word_list[word_list.findIndex(word => word.word == words[j])].num_occurrences++;
				}
			}
		}
	}
	
	return word_list;
}

function main() {
	try {
		if (!Deno.lstatSync("output").isDirectory) {
			Deno.mkdirSync("output");
		}
	} catch (e) {
		Deno.mkdirSync("output");
	}

	var output = JSON.parse(Deno.readTextFileSync(prompt("Enter the name of the output file > ")));
	var summary_object = {};

	summary_object["average_text_length"] = calculate_average_text_length(output);

	var word_list = generate_word_list(output);
	word_list.sort((a, b) => b.num_occurrences - a.num_occurrences);

	summary_object["word_list"] = word_list;

	var words_csv = new csv();

	words_csv.pushRow(["Word", "Occurrences"]);
	words_csv.pushRow(["", ""]);

	for (var i = 0; i < word_list.length; i++) {
		words_csv.pushRow([word_list[i].word, String(word_list[i].num_occurrences)]);
	}

	Deno.writeTextFileSync("output/words.csv", words_csv.serialize());
	console.log("CSV file written to output/words.csv");

	Deno.writeTextFileSync("output/words-excel.csv", words_csv.serialize(";"));
	console.log("CSV file written to output/words-excel.csv");

	Deno.writeTextFileSync("output/words.txt", words_csv.str());
	console.log("TXT file written to output/words.txt");

	Deno.writeTextFileSync("output/summary.json", JSON.stringify(summary_object, null, 4));
	console.log("JSON file written to output/summary.json");

	console.log("\nSummary report: ");
	console.log("Average text length: " + summary_object["average_text_length"] + "\n");

	console.log("Top 20 most used words: ");
	for (var i = 0; i < 20; i++) {
		console.log(word_list[i].word + " (" + word_list[i].num_occurrences + ")");
	}
}

main();
