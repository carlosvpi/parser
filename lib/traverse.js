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

const getTraverser = module.exports.getTraverser = (userBubble = {}, userCapture = {}) => {
	const bubble = {
		[CONCAT.type]: (...nodes) => {
			debugger
			return nodes
		},
		...userBubble
	}
	const capture = {
		...userCapture
	}
	const traverseFromNode = ([root, children = []]) => {
		debugger
		if (getTraverser.valueTypes.includes(root)) return children[0]
		const capturedChildren = typeof capture[root] === 'function'
			? capture[root](...children)
			: children
		return typeof bubble[root] === 'function'
			? bubble[root](...capturedChildren.map(traverseFromNode))
			: root
	}
	return traverseFromNode
}

getTraverser.valueTypes = [MATCH.type, LITERAL.type]
