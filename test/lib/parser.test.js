const assert = require('assert')
const { parser } = require('../../lib/parser')

describe('parser module', () => {
	it('Analyzes arithmetic expressions on integers', () => {
		const sParser = parser(`S = F [('+' | '-') Ws N];F = B [('*' | '/') Ws F];B = '(' Ws S ')' Ws | N;N = /\-?[0-9]+(\.[0-9]+)?/ Ws | /\-?\.[0-9]+/ Ws;Ws = {/[\ \t\n]/};`)
		const tree = sParser('-.31 + 3.41 * 2 / (1+4)')
		assert.deepEqual(tree, [])
	})
})
