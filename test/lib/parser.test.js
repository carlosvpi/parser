const assert = require('assert')
const { parser } = require('../../lib/parser')

describe('parser module', () => {
	it('Analyzes arithmetic expressions on integers', () => {
		const sParser = parser(`
			S = N { ( '+' | '-' ) N };
			N = /[0-9]+/;
		`)
		const tree = sParser.S('1+2-2-4-6+2+6-2+5')
		assert.deepEqual(tree, ["LIST",[["NT",["LIST",[["MATCH","1"]]]],["LIST",[["LIST",[["LIST",[["LITERAL","+"]]],["NT",["LIST",[["MATCH","2"]]]]]],["LIST",[["LIST",[["LITERAL","-"]]],["NT",["LIST",[["MATCH","2"]]]]]],["LIST",[["LIST",[["LITERAL","-"]]],["NT",["LIST",[["MATCH","4"]]]]]],["LIST",[["LIST",[["LITERAL","-"]]],["NT",["LIST",[["MATCH","6"]]]]]],["LIST",[["LIST",[["LITERAL","+"]]],["NT",["LIST",[["MATCH","2"]]]]]],["LIST",[["LIST",[["LITERAL","+"]]],["NT",["LIST",[["MATCH","6"]]]]]],["LIST",[["LIST",[["LITERAL","-"]]],["NT",["LIST",[["MATCH","2"]]]]]],["LIST",[["LIST",[["LITERAL","+"]]],["NT",["LIST",[["MATCH","5"]]]]]]]]]])
	})
	it('Analyzes arithmetic expressions on integers', () => {
		const sParser = parser(`
			S = F [('+' | '-') Ws S];
			F = B [('*' | '/') Ws F];
			B = '(' Ws S ')' Ws | N;
			N = /\-?[0-9]+(\.[0-9]+)?/ Ws
				| /\-?\.[0-9]+/ Ws;
			Ws = {/[\ \t\n]/};
		`)
		const tree = sParser.S('-.31 + 3.41 * 2 / (1+4)')
		assert.deepEqual(tree, ["LIST",[["NT",["LIST",[["NT",["LIST",[["NT",["LIST",[["MATCH","-.31"],["NT",["LIST",[["LIST",[["LIST",[["MATCH"," "]]]]]]]]]]]]]],["LIST",[]]]]],["LIST",[["LIST",[["LITERAL","+"]]],["NT",["LIST",[["LIST",[["LIST",[["MATCH"," "]]]]]]]],["NT",["LIST",[["NT",["LIST",[["NT",["LIST",[["NT",["LIST",[["MATCH","3.41"],["NT",["LIST",[["LIST",[["LIST",[["MATCH"," "]]]]]]]]]]]]]],["LIST",[["LIST",[["LITERAL","*"]]],["NT",["LIST",[["LIST",[["LIST",[["MATCH"," "]]]]]]]],["NT",["LIST",[["NT",["LIST",[["NT",["LIST",[["MATCH","2"],["NT",["LIST",[["LIST",[["LIST",[["MATCH"," "]]]]]]]]]]]]]],["LIST",[["LIST",[["LITERAL","/"]]],["NT",["LIST",[["LIST",[["LIST",[["MATCH"," "]]]]]]]],["NT",["LIST",[["NT",["LIST",[["LITERAL","("],["NT",["LIST",[["LIST",[]]]]],["NT",["LIST",[["NT",["LIST",[["NT",["LIST",[["NT",["LIST",[["MATCH","1+4"],["NT",["LIST",[["LIST",[]]]]]]]]]]],["LIST",[]]]]],["LIST",[]]]]],["LITERAL",")"],["NT",["LIST",[["LIST",[]]]]]]]],["LIST",[]]]]]]]]]]]]]]],["LIST",[]]]]]]]]])
	})
})
