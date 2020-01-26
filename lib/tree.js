module.exports.treeFrom = (root, children) => {
	return [root, children]
}

module.exports.getRoot = ([root]) => root

module.exports.getChildren = ([_, children]) => children
