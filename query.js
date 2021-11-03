import { csv } from "./csv.js";

function main() {
	var query = prompt("Enter a query: ");

	var summary_data = Deno.readTextFileSync("output/words.csv");
	var summary_csv = new csv(summary_data);

	summary_csv.parse();

	var result_csv = new csv();

	result_csv.pushRow(["Word", "Occurrences", "Percentage"]);
	result_csv.pushRow(["", "", ""]);

	summary_csv.query(query, 0).forEach(row => result_csv.pushRow(row));
	

	Deno.writeTextFileSync("output/query.csv", result_csv.serialize());
	console.log("Query results written to output/query.csv");

	var excel_csv_copy = new csv();
	excel_csv_copy.parsed_document = Object.assign([], result_csv.parsed_document);
	excel_csv_copy.parsed_document= excel_csv_copy.parsed_document.map(row => row.map(cell => cell.indexOf("%") != 1 ? cell.replace(/\./g, ",") : cell));

	Deno.writeTextFileSync("output/query-excel.csv", excel_csv_copy.serialize(";"));
	console.log("Query results written to output/query-excel.csv");

	console.log(result_csv.str());
}

main();