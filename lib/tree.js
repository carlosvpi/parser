const getRootDefault = module.exports.getRoot = ([root]) => root

const getChildrenDefault = module.exports.getChildren = ([_, children = []]) => children

const depthRun = module.exports.depthRun = ({ getRoot = getRootDefault, getChildren = getChildrenDefault } = {}) => function* depthRunGenerator (tree) {
	const children = getChildren(tree) || []
	yield getRoot(tree)
	for (let i = 0; i < children.length; i++) {
		yield* depthRun()(children[i])
	}
}

const breadthRun = module.exports.breadthRun = ({ getRoot = getRootDefault, getChildren = getChildrenDefault } = {}) => function* breadthRunGenerator (tree) {
	let stack = [tree]
	let node
	while (stack.length) {
		[node, ...stack] = stack
		yield getRoot(node)
		stack = stack.concat(getChildren(node) || [])
	}
}

const reduce = module.exports.reduce = (reductor, initial) => (generator) => {
	let value = initial === undefined
		? generator.next().value
		: initial
	for (let item of generator) {
		value = reductor(value, item)
	}
	return value
}
