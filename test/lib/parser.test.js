const assert = require('assert')
const { parser } = require('../../lib/parser')

describe('parser module', () => {
	it('Analyzes arithmetic expressions on integers', () => {
		const sParser = parser(`
			S = N { ( '+' | '-' ) N };
			N = /[0-9]+/;
		`)
		const tree = sParser('1+2-2-4-6+2+6-2+5')
		assert.deepEqual(tree, {tree:['DISJUNCTION',['EXCEPTION',[['NT',['DISJUNCTION',['EXCEPTION',[['MATCH','1']]]]],['CLOSURE',[['DISJUNCTION',['EXCEPTION',[['DISJUNCTION',['EXCEPTION',[['LITERAL','+']]]],['NT',['DISJUNCTION',['EXCEPTION',[['MATCH','2']]]]]]]],['DISJUNCTION',['EXCEPTION',[['DISJUNCTION',['EXCEPTION',[['LITERAL','-']]]],['NT',['DISJUNCTION',['EXCEPTION',[['MATCH','2']]]]]]]],['DISJUNCTION',['EXCEPTION',[['DISJUNCTION',['EXCEPTION',[['LITERAL','-']]]],['NT',['DISJUNCTION',['EXCEPTION',[['MATCH','4']]]]]]]],['DISJUNCTION',['EXCEPTION',[['DISJUNCTION',['EXCEPTION',[['LITERAL','-']]]],['NT',['DISJUNCTION',['EXCEPTION',[['MATCH','6']]]]]]]],['DISJUNCTION',['EXCEPTION',[['DISJUNCTION',['EXCEPTION',[['LITERAL','+']]]],['NT',['DISJUNCTION',['EXCEPTION',[['MATCH','2']]]]]]]],['DISJUNCTION',['EXCEPTION',[['DISJUNCTION',['EXCEPTION',[['LITERAL','+']]]],['NT',['DISJUNCTION',['EXCEPTION',[['MATCH','6']]]]]]]],['DISJUNCTION',['EXCEPTION',[['DISJUNCTION',['EXCEPTION',[['LITERAL','-']]]],['NT',['DISJUNCTION',['EXCEPTION',[['MATCH','2']]]]]]]],['DISJUNCTION',['EXCEPTION',[['DISJUNCTION',['EXCEPTION',[['LITERAL','+']]]],['NT',['DISJUNCTION',['EXCEPTION',[['MATCH','5']]]]]]]]]]]]],rest:''})
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
		const tree = sParser('-.31 + 3.41 * 2 / (1+4)')
		assert.deepEqual(tree, {"tree":["DISJUNCTION",["EXCEPTION",[["NT",["DISJUNCTION",["EXCEPTION",[["NT",["DISJUNCTION",["EXCEPTION",[["NT",["DISJUNCTION",["EXCEPTION",[["MATCH","-.31"],["NT",["DISJUNCTION",["EXCEPTION",[["CLOSURE",[["DISJUNCTION",["EXCEPTION",[["MATCH"," "]]]]]]]]]]]]]]]]]],["OPTION",""]]]]],["OPTION",["DISJUNCTION",["EXCEPTION",[["DISJUNCTION",["EXCEPTION",[["LITERAL","+"]]]],["NT",["DISJUNCTION",["EXCEPTION",[["CLOSURE",[["DISJUNCTION",["EXCEPTION",[["MATCH"," "]]]]]]]]]],["NT",["DISJUNCTION",["EXCEPTION",[["NT",["DISJUNCTION",["EXCEPTION",[["NT",["DISJUNCTION",["EXCEPTION",[["NT",["DISJUNCTION",["EXCEPTION",[["MATCH","3.41"],["NT",["DISJUNCTION",["EXCEPTION",[["CLOSURE",[["DISJUNCTION",["EXCEPTION",[["MATCH"," "]]]]]]]]]]]]]]]]]],["OPTION",["DISJUNCTION",["EXCEPTION",[["DISJUNCTION",["EXCEPTION",[["LITERAL","*"]]]],["NT",["DISJUNCTION",["EXCEPTION",[["CLOSURE",[["DISJUNCTION",["EXCEPTION",[["MATCH"," "]]]]]]]]]],["NT",["DISJUNCTION",["EXCEPTION",[["NT",["DISJUNCTION",["EXCEPTION",[["NT",["DISJUNCTION",["EXCEPTION",[["MATCH","2"],["NT",["DISJUNCTION",["EXCEPTION",[["CLOSURE",[["DISJUNCTION",["EXCEPTION",[["MATCH"," "]]]]]]]]]]]]]]]]]],["OPTION",["DISJUNCTION",["EXCEPTION",[["DISJUNCTION",["EXCEPTION",[["LITERAL","/"]]]],["NT",["DISJUNCTION",["EXCEPTION",[["CLOSURE",[["DISJUNCTION",["EXCEPTION",[["MATCH"," "]]]]]]]]]],["NT",["DISJUNCTION",["EXCEPTION",[["NT",["DISJUNCTION",["EXCEPTION",[["LITERAL","("],["NT",["DISJUNCTION",["EXCEPTION",[["CLOSURE",[]]]]]],["NT",["DISJUNCTION",["EXCEPTION",[["NT",["DISJUNCTION",["EXCEPTION",[["NT",["DISJUNCTION",["EXCEPTION",[["NT",["DISJUNCTION",["EXCEPTION",[["MATCH","1+4"],["NT",["DISJUNCTION",["EXCEPTION",[["CLOSURE",[]]]]]]]]]]]]]],["OPTION",""]]]]],["OPTION",""]]]]],["LITERAL",")"],["NT",["DISJUNCTION",["EXCEPTION",[["CLOSURE",[]]]]]]]]]],["OPTION",""]]]]]]]]]]]]]]]]]]]]],["OPTION",""]]]]]]]]]]]],"rest":""})
	})
})
