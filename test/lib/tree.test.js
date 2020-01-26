const assert = require('assert')
const {
	treeFrom,
	getRoot,
	getChildren
} = require('../../lib/tree')

describe('tree', () => {
	it('Returns correct root and children', () => {
		const root = 'this is a root'
		const children = ['child1', 'child2']
		const tree = treeFrom(root, children)

		assert.equal(getRoot(tree), root)
		assert.equal(getChildren(tree), children)
	})
})