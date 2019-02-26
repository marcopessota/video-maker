const readline = require('readline-sync')

function start() {
	const content = {}
	
	content.searchTerm = askAndReturnSearchTerm()
	content.prefix = askAndReturnPrefix()

	function askAndReturnSearchTerm(){
		return readline.question("Digite um termo para buscar na Wikipedia: ")
	}

	function askAndReturnPrefix(){
		const prefixes  = ['Quem é', 'O que é', 'Qual é a história dele'];
		const selectedPrefixIndex = readline.keyInSelect(prefixes);
		return prefixes[selectedPrefixIndex];
	}
	console.log(content);
}

start()