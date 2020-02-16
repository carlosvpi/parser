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
		throw new Error({ errors: grammarErrors, grammar: parsedGrammar })
	}
	const [_, ruleNodes] = parsedGrammar
	const hash = ruleNodes.reduce((hash, [_2, [[_3, head], [_4, body]]]) => {
		hash[head] = createParserFromNode(body, hash)
		return hash
	}, {})
	return (input, configs) => {
		const errors = []
		const result = hash[axiom](input, { original: input, errors, ...configs})
		if (!Array.isArray(result)) {
			throw new Error({ errors: `Unexpected error found while parsing. Please, report it to https://github.com/carlosvpi/pasre/issues` })
		}
		const [tree, rest] = result
		if (errors.length) {
			throw new Error({ errors, tree, rest })
		}
		// Transform tree nodeTypes from 'CONCAT' and such to 'MyRuleHead' and such
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
			return hash[value] // ADD STH TO IDENTIFY THE NT (RULE HEAD)
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
			throw new Error(`There has been some kind of error???`)
	}
}
