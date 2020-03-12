const assert = require('assert')
const { getTraverser } = require('../../lib/traverse')

const v = getTraverser.valueTypes[0]

describe('traverse', () => {
	it('Traverses the tree with bubbling', () => {
		const tree = ['+', ['*', [v,3], ['-', [v,4], [v,1]]], ['/', ['+', [v,5], [v,3]], [v,2]], ['-', [v,11], ['*', [v,1], [v,2]]]]
		const traverser = getTraverser({
			'+': (...values) => [values.reduce((acc, [value]) => acc + value, 0)],
			'-': ([minuend], [subtrahend]) => [minuend - subtrahend],
			'*': (...values) => [values.reduce((acc, [value]) => acc * value, 1)],
			'/': ([dividend], [divisor]) => [dividend / divisor],
		})
		assert.deepEqual(traverser(tree), [22])
	})
	it('Traverses the tree with bubbling and capturing', () => {
		const tree = ['+', ['*', [v, 3], ['-', [v,4], [v,1]]], ['/', ['+', [v,5], [v,3]], [v,2]], ['-', [v,11], ['*', [v,1], [v,2]]]]
		const traverser = getTraverser({
			'+': (...values) => [values.reduce((acc, [value]) => acc + value, 0)],
			'-': ([minuend], [subtrahend]) => [minuend - subtrahend],
			'*': (...values) => [values.reduce((acc, [value]) => acc * value, 1)],
			'/': ([dividend], [divisor]) => [dividend / divisor],
		}, {
			'/': (...values) => [[...values[0], [v,5]], values[1]]
		})
		assert.deepEqual(traverser(tree), [24.5])
	})
})
