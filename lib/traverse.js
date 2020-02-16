const {
	getRoot: getRootDefault,
	getChildren: getChildrenDefault
} = require('./tree')

const traverse = module.exports.traverse = (hash, { getRoot = getRootDefault, getChildren = getChildrenDefault } = {}) => {
	const _traverse = (tree) => hash[getRoot(tree)](...getChildren(tree).map(_traverse))
	return _traverse
}
