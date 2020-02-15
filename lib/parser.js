const {
	getRoot,
	getChildren,
	depthRun,
	breadthRun,
	reduce
} = require('../../lib/tree')
const {
	WS,
	WSs,
	NT,
	Conc,
	Xcep,
	Disj,
	Exp,
	Rule,
	EBNF
} = require('../../lib/rules')

const parser = module.exports.parser = (config = {}) => (grammar) => {
	const createParserFromParsedGrammar = x => x
	const grammarErrors = []
	const parsedGrammar = EBNF(grammar, { original: grammar, grammarErrors, ...config })
	if (grammarErrors.length) {
		throw new Error({ errors: grammarErrors, grammar: parsedGrammar })
	}
	const parserFromGrammar = createParserFromParsedGrammar(parsedGrammar)
	return (input, configs) => {
		const errors = []
		const result = parserFromGrammar(input, { original: input, errors, ...configs})
		if (!Array.isArray(result)) {
			throw new Error({ errors: `Unexpected error found while parsing. Please, report it to https://github.com/carlosvpi/pasre/issues` })
		}
		const [tree, rest] = result
		if (errors.length) {
			throw new Error({ errors, tree, rest })
		}
		return { tree, rest }
	}
}

