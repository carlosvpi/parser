const assert = require('assert')
const parser = require('../../lib/parser')

describe('parser module', () => {
  it('Analyzes arithmetic expressions on integers', () => {
    const sParser = parser(`
      S = N { ( '+' | '-' ) N };
      N = /[0-9]+/;
    `)
    const tree = sParser.S('1+2-2-4-6+2+6-2+5')
    assert.deepEqual(tree, ["S",["$CONCAT",["N",["$CONCAT",["$MATCH","1"]]],["$CONCAT",["$CONCAT",["$CONCAT",["$LITERAL","+"]],["N",["$CONCAT",["$MATCH","2"]]]],["$CONCAT",["$CONCAT",["$LITERAL","-"]],["N",["$CONCAT",["$MATCH","2"]]]],["$CONCAT",["$CONCAT",["$LITERAL","-"]],["N",["$CONCAT",["$MATCH","4"]]]],["$CONCAT",["$CONCAT",["$LITERAL","-"]],["N",["$CONCAT",["$MATCH","6"]]]],["$CONCAT",["$CONCAT",["$LITERAL","+"]],["N",["$CONCAT",["$MATCH","2"]]]],["$CONCAT",["$CONCAT",["$LITERAL","+"]],["N",["$CONCAT",["$MATCH","6"]]]],["$CONCAT",["$CONCAT",["$LITERAL","-"]],["N",["$CONCAT",["$MATCH","2"]]]],["$CONCAT",["$CONCAT",["$LITERAL","+"]],["N",["$CONCAT",["$MATCH","5"]]]]]]])
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
    assert.deepEqual(tree, ["S",["$CONCAT",["F",["$CONCAT",["B",["$CONCAT",["N",["$CONCAT",["$MATCH","-.31"],["Ws",["$CONCAT",["$CONCAT",["$CONCAT",["$MATCH"," "]]]]]]]]],["$CONCAT"]]],["$CONCAT",["$CONCAT",["$LITERAL","+"]],["Ws",["$CONCAT",["$CONCAT",["$CONCAT",["$MATCH"," "]]]]],["S",["$CONCAT",["F",["$CONCAT",["B",["$CONCAT",["N",["$CONCAT",["$MATCH","3.41",".41"],["Ws",["$CONCAT",["$CONCAT",["$CONCAT",["$MATCH"," "]]]]]]]]],["$CONCAT",["$CONCAT",["$LITERAL","*"]],["Ws",["$CONCAT",["$CONCAT",["$CONCAT",["$MATCH"," "]]]]],["F",["$CONCAT",["B",["$CONCAT",["N",["$CONCAT",["$MATCH","2",undefined],["Ws",["$CONCAT",["$CONCAT",["$CONCAT",["$MATCH"," "]]]]]]]]],["$CONCAT",["$CONCAT",["$LITERAL","/"]],["Ws",["$CONCAT",["$CONCAT",["$CONCAT",["$MATCH"," "]]]]],["F",["$CONCAT",["B",["$CONCAT",["$LITERAL","("],["Ws",["$CONCAT",["$CONCAT"]]],["S",["$CONCAT",["F",["$CONCAT",["B",["$CONCAT",["N",["$CONCAT",["$MATCH","1+4","+4"],["Ws",["$CONCAT",["$CONCAT"]]]]]]],["$CONCAT"]]],["$CONCAT"]]],["$LITERAL",")"],["Ws",["$CONCAT",["$CONCAT"]]]]],["$CONCAT"]]]]]]]]],["$CONCAT"]]]]]])
  })
  it('Analyzes a programming language grammar', () => {
    const tree = parser(`
      Program = [W] { Declaration };
      Declaration = 'export' W Definition ['as' W Id] ['from' W IdPath] | Definition;
      Definition = 'type' W CapitalId ['=' [W] Type]
      CapitalId = /[A-Z][a-zA-Z0-9_]*/ [W];
      Type = CapitalId { CapitalId };
      Id = /[a-zA-Z_][a-zA-Z0-9_]*/ - Reserved [W];
      IdPath = Id { '::' Id };
      W = Whitespace { Whitespace };
      Whitespace = /[ \n\t]/;
      Reserved = 'type' | 'function' | 'module' | 'as' | 'from' | 'export' | 'import' | 'of' | 'in' | 'let' | 'private';
    `).Program(`
export type MyType
    `)
    assert.deepEqual(tree, ["Program",["$CONCAT",["$CONCAT",["W",["$CONCAT",["Whitespace",["$CONCAT",["$MATCH","\n"]]],["$CONCAT"]]]],["$CONCAT"]]])
  })
})
