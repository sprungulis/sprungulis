export function wasm_print(a) {
	console.log(a);
	//Priedes izvades funkcija
}
export function code_replace(a, line, col, span) {
	console.log(a, line, col, span);
	//Koda aizvietošana
}

export async function wasm_input() {
	return "teststring";
	//Input funkcija, pagaidām nestrādā
}
