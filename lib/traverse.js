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

const generalBubble = {
	[MATCH.type]: (_, node) => [node],
	[LITERAL.type]: (_, node) => [node],
	[CONCAT.type]: (...nodes) => nodes
		.reduce((acc, node) => Array.isArray(node) ? [...acc, ...node] : [...acc, node], [])
}

const getTraverser = module.exports.getTraverser = (userBubble = {}, capture = {}) => {
	const bubble = {
		...generalBubble,
		...userBubble
	}
	let i = 0
	const traverseFromNode = ([root, ...children]) => {
		let j = i++
		if (getTraverser.valueTypes.includes(root)) {
			return children
		}
		const capturedChildren = typeof capture[root] === 'function'
			? capture[root](...children)
			: children
		const traversedChildren = capturedChildren.map(traverseFromNode)
		const result = typeof bubble[root] === 'function'
			? bubble[root](...traversedChildren)
			: []
		return result
	}
	return traverseFromNode
}

getTraverser.valueTypes = [MATCH.type, LITERAL.type]
