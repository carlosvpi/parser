const getTraverser = module.exports.getTraverser = (bubble = {}, capture = {}) => {
	const traverseFromNode = ([root, children = []]) => {
		if (root === getTraverser.valueType) return children[0]
		const capturedChildren = typeof capture[root] === 'function'
			? capture[root](...children)
			: children
		return typeof bubble[root] === 'function'
			? bubble[root](...capturedChildren.map(traverseFromNode))
			: root
	}
	return traverseFromNode
}

getTraverser.valueType = {}
