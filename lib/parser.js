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
			return DISJUNCTION(...value.map(v => createParserFromNode(v, hash)))
		case 'Exception':
			return EXCEPTION(createParserFromNode(value[0][1], hash), value[1][1] ? createParserFromNode(value[1][1], hash) : undefined)
		case 'Concatenation':
			return CONCAT(...value.map(manyRules))
		case 'NT':
			return (...inputs) => {
				const [node, rest] = hash[value](...inputs)
				return [['NT', node], rest]
			}
		case 'Repetition':
			return REPETITION(value[0], createParserFromNode(value[1], hash))
		case 'DblQuote':
		case 'SglQuote':
			return LITERAL(value)
		case 'Regex':
			return MATCH(value)
		case 'Option':
			return OPTION(createParserFromNode(value, hash))
		case 'Closure':
			return CLOSURE(createParserFromNode(value, hash))
		case 'Group':
			return createParserFromNode(value, hash) // ADD STH TO IDENTIFY THAT THIS IS A GROUP
		case 'WS':
			return WS
		case 'WSs':
			return WSs
		case 'Expression':
			throw new Error({ errors: [`Unexpected error: invalid node type. Please, report it to https://github.com/carlosvpi/pasre/issues`], payload: { type, value, hash } })
	}
}

const restructureTree = (x) => x
