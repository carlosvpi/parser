const assert = require('assert')
const { reformat } = require('../../lib/reformat')

describe('reformat', () => {
	it('tests the reformat function', () => {
		const array = [1, 2, 3]
		const reduce = (a,b) => a+b
		const node = ['A', ['B', array]]
		assert.deepEqual(reformat(node, { A: value => value[1].reduce(reduce) }), array.reduce(reduce))
		assert.deepEqual(reformat(node, { A: { B: value => value.reduce(reduce) } }), array.reduce(reduce))
	})
	it('tests the reformat function when null', () => {
		const value = 42
		const node = ['A', ['B', value]]
		assert.deepEqual(reformat(node, { A: { B: { C: value => value } } }), null)
	})
	// it('tests branching tree', () => {
	// 	const value1 = 42
	// 	const value2 = 'correct'
	// 	const node = ['A', ['B', value1], ['C', value2]]
	// 	assert.deepEqual(reformat(node, { A: { B: value => value, C: value => value } } }), null)
	// })
})