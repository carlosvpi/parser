const assert = require('assert')
const { traverse } = require('../../lib/tree')

t = (r,...c) => [r,c]

describe('traverse', () => {
	it('Traverses the tree', () => {
		const tree = t('a', 1, 2, t('b', t('c')), t('d', t('e', t('f'), t('g')), t('h')), t('i'))
		const hash = {
			'a': (values) => 'a' + values
		}
		assert.deepEqual(traverse(tree), [])
	})
	it('Returns correct children (when there aren many)', () => {
		const tree = ['child1', ['child2', 'child3']]
		assert.equal(getChildren(tree), tree[1])
	})
})

describe('getDepthRun', () => {
	it('Returns correct depth run of a tree', () => {
		const tree = [1,[[2,[[3,[[4,[]],[5,[]]]],[6,[]]]],[7,[[8,[[9,[]],[10,[]]]],[11,[[12,[]]]],[13,[]]]],[14,[[15,[[16,[]],[17,[]]]]]]]]
		let array = []
		for (let item of depthRun()(tree)) {
			array.push(item)
		}
		assert.deepEqual(array, [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17])
	})
})

describe('getBreadthRun', () => {
	it('Returns correct depth run of a tree', () => {
		const tree = [1,[[2,[[3,[[4,[]],[5,[]]]],[6,[]]]],[7,[[8,[[9,[]],[10,[]]]],[11,[[12,[]]]],[13,[]]]],[14,[[15,[[16,[]],[17,[]]]]]]]]
		let array = []
		for (let item of breadthRun()(tree)) {
			array.push(item)
		}
		assert.deepEqual(array, [1,2,7,14,3,6,8,11,13,15,4,5,9,10,12,16,17])
	})
})

describe('reduce', () => {
	it('Correctly reduces (adds) the values of a generator; no initial value', () => {
		function* numbers () {
			for (let i = 1; i <= 10; i++) {
				yield i
			}
		}
		assert.equal(reduce((a, b) => a + b)(numbers()), 55)
	})
	it('Correctly reduces (adds) the values of a generator; with initial value', () => {
		function* numbers () {
			for (let i = 1; i <= 10; i++) {
				yield i
			}
		}
		assert.equal(reduce((a, b) => a + b, 10)(numbers()), 65)
	})
})
