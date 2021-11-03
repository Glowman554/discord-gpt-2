import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

async function download_comments(page = 1) {
	var response = await(await fetch(`https://e621.net/comments?page=${page}`)).text();
	var search_res_dom = new DOMParser().parseFromString(response, 'text/html');

	return Array.from(search_res_dom.querySelectorAll(".content > div.styled-dtext > p")).map(x => x.textContent);
}

async function main() {
	try {
		if (!Deno.lstatSync("output").isDirectory) {
			Deno.mkdirSync("output");
		}
	} catch (e) {
		Deno.mkdirSync("output");
	}

	var page = 1;

	while (true) {
		let comments = await await download_comments(page++);
		console.log(`Downloaded ${comments.length} comments.`);
		Deno.writeTextFileSync(`output/comments_${page - 1}.txt`, comments.join("\n"));
	}
}

main();