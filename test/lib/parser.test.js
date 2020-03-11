const assert = require('assert')
const { parser } = require('../../lib/parser')

describe('parser module', () => {
	it('Analyzes arithmetic expressions on integers', () => {
		const sParser = parser(`
			S = N { ( '+' | '-' ) N };
			N = /[0-9]+/;
		`)
		const tree = sParser.S('1+2-2-4-6+2+6-2+5')
		// console.log(JSON.stringify(tree))
		assert.deepEqual(tree, ["S",["$CONCAT",[["N",["$CONCAT",[["$MATCH","1"]]]],["$CONCAT",[["$CONCAT",[["$CONCAT",[["$LITERAL","+"]]],["N",["$CONCAT",[["$MATCH","2"]]]]]],["$CONCAT",[["$CONCAT",[["$LITERAL","-"]]],["N",["$CONCAT",[["$MATCH","2"]]]]]],["$CONCAT",[["$CONCAT",[["$LITERAL","-"]]],["N",["$CONCAT",[["$MATCH","4"]]]]]],["$CONCAT",[["$CONCAT",[["$LITERAL","-"]]],["N",["$CONCAT",[["$MATCH","6"]]]]]],["$CONCAT",[["$CONCAT",[["$LITERAL","+"]]],["N",["$CONCAT",[["$MATCH","2"]]]]]],["$CONCAT",[["$CONCAT",[["$LITERAL","+"]]],["N",["$CONCAT",[["$MATCH","6"]]]]]],["$CONCAT",[["$CONCAT",[["$LITERAL","-"]]],["N",["$CONCAT",[["$MATCH","2"]]]]]],["$CONCAT",[["$CONCAT",[["$LITERAL","+"]]],["N",["$CONCAT",[["$MATCH","5"]]]]]]]]]]])
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
		// console.log(JSON.stringify(tree))
		assert.deepEqual(tree, ["S",["$CONCAT",[["F",["$CONCAT",[["B",["$CONCAT",[["N",["$CONCAT",[["$MATCH","-.31"],["Ws",["$CONCAT",[["$CONCAT",[["$CONCAT",[["$MATCH"," "]]]]]]]]]]]]]],["$CONCAT",[]]]]],["$CONCAT",[["$CONCAT",[["$LITERAL","+"]]],["Ws",["$CONCAT",[["$CONCAT",[["$CONCAT",[["$MATCH"," "]]]]]]]],["S",["$CONCAT",[["F",["$CONCAT",[["B",["$CONCAT",[["N",["$CONCAT",[["$MATCH","3.41"],["Ws",["$CONCAT",[["$CONCAT",[["$CONCAT",[["$MATCH"," "]]]]]]]]]]]]]],["$CONCAT",[["$CONCAT",[["$LITERAL","*"]]],["Ws",["$CONCAT",[["$CONCAT",[["$CONCAT",[["$MATCH"," "]]]]]]]],["F",["$CONCAT",[["B",["$CONCAT",[["N",["$CONCAT",[["$MATCH","2"],["Ws",["$CONCAT",[["$CONCAT",[["$CONCAT",[["$MATCH"," "]]]]]]]]]]]]]],["$CONCAT",[["$CONCAT",[["$LITERAL","/"]]],["Ws",["$CONCAT",[["$CONCAT",[["$CONCAT",[["$MATCH"," "]]]]]]]],["F",["$CONCAT",[["B",["$CONCAT",[["$LITERAL","("],["Ws",["$CONCAT",[["$CONCAT",[]]]]],["S",["$CONCAT",[["F",["$CONCAT",[["B",["$CONCAT",[["N",["$CONCAT",[["$MATCH","1+4"],["Ws",["$CONCAT",[["$CONCAT",[]]]]]]]]]]],["$CONCAT",[]]]]],["$CONCAT",[]]]]],["$LITERAL",")"],["Ws",["$CONCAT",[["$CONCAT",[]]]]]]]],["$CONCAT",[]]]]]]]]]]]]]]],["$CONCAT",[]]]]]]]]]])
	})
})
