const readline = require('readline-sync')
const state = require('./state.js')

function robot() {
	const content = {
		maximunSentences : 7
	}
	
	content.searchTerm = askAndReturnSearchTerm()
	content.prefix = askAndReturnPrefix()
    state.save(content)
	// console.log(JSON.stringify(content, null, 4));

	function askAndReturnSearchTerm(){
		return readline.question("Digite um termo para buscar na Wikipedia: ")
	}

	function askAndReturnPrefix(){
		const prefixes  = ['Quem é', 'O que é', 'Qual é a história dele'];
		const selectedPrefixIndex = readline.keyInSelect(prefixes);
		return prefixes[selectedPrefixIndex];
	}

    
}

module.exports = robot