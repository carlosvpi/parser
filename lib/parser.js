const {
	getRoot,
	getChildren,
	depthRun,
	breadthRun,
	reduce
} = require('./tree')
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
} = require('./rules')
const {
	MATCH,
	LITERAL,
	CONCAT,
	DISJUNCTION,
	OPTION,
	CLOSURE,
	REPETITION,
	EXCEPTION,
	EXPECT
} = require('./hoc')

const parser = module.exports.parser = (grammar, config = {}) => {
	const { axiom = 'S' } = config
	const grammarErrors = []
	const parsedGrammar = EBNF(grammar, { original: grammar, grammarErrors, ...config })
	if (grammarErrors.length) {
		throw new Error({ errors: grammarErrors, payload: { grammar, parsedGrammar } })
	}
	const [[_, ruleNodes], _2] = parsedGrammar
	const hash = ruleNodes.reduce((hash, [_2, [[_3, head], [_4, body]]]) => {
		hash[head] = createParserFromNode(body, hash)
		return hash
	}, {})
	console.group("hash['Ws'](' ')")
	console.log(hash['Ws'](' '))
	console.endGroup()
	return (input, configs) => {
		const errors = []
		const result = hash[axiom](input, { original: input, errors, ...configs})
		if (!Array.isArray(result)) {
			throw new Error({ errors: [`Unexpected error: invalid returned value. Please, report it to https://github.com/carlosvpi/pasre/issues`], payload: { result, hash, axiom, input } })
		}
		const [rawTree, rest] = result
		if (errors.length) {
			throw new Error({ errors, payload: { tree, rest } })
		}
		// Transform tree nodeTypes from 'CONCAT' and such to 'MyRuleHead' and such
		const tree = restructureTree(rawTree)
		return { tree, rest }
	}
}

const createParserFromNode = (node, hash) => {
	const [type, value] = node
	const manyRules = (ruleNode, index) => {
		const parser = createParserFromNode(ruleNode, hash)
		return index ? EXPECT(parser) : parser
	}
	switch (type) {
		case 'Disjunction':
			return DISJUNCTION(...value.map(manyRules))
		case 'Exception':
			return EXCEPTION(...value.map(manyRules))
		case 'Concatenation':
			return CONCAT(...value.map(manyRules))
		case 'NT':
			return (...inputs) => {
				console.log('NT', value, ...inputs)
				return [['NT', hash[value](...inputs)[0][1]], rest]
			}
		case 'Repetition':
			return REPETITION(value[0], createParserFromNode(value[1], hash))
		case 'DblQuote':
		case 'SglQuote':
			return LITERAL(value[0])
		case 'Regex':
			return MATCH(value[0])
		case 'Option':
			return OPTION(value[0])
		case 'Closure':
			return CLOSURE(value[0])
		case 'Group':
			return createParserFromNode(value[0], hash) // ADD STH TO IDENTIFY THAT THIS IS A GROUP
		case 'Expression':
			throw new Error({ errors: [`Unexpected error: invalid node type. Please, report it to https://github.com/carlosvpi/pasre/issues`], payload: { type, value, hash } })
	}
}

const restructureTree = (x) => x
