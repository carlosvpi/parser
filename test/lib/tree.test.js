const assert = require('assert')
const {
	getRoot,
	getChildren,
	depthRun,
	breadthRun,
	reduce
} = require('../../lib/tree')

describe('tree module', () => {
	describe('getRoot', () => {
		it('Returns correct root', () => {
			const tree = ['child1', 'child2']
			assert.equal(getRoot(tree), tree[0])
		})
	})

	describe('getChildren', () => {
		it('Returns correct children (when there arent any)', () => {
			const tree = ['child1']
			assert.deepEqual(getChildren(tree), [])
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

})