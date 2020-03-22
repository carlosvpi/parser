const assert = require('assert')
const parser = require('../../lib/parser')

describe('parser module', () => {
  it('Analyzes arithmetic expressions on integers', () => {
    const tree = parser(`
      S = N { ( '+' | '-' ) N };
      N = /[0-9]+/;
    `).S('1+2-2-4-6+2+6-2+5')
    assert.deepEqual(tree, [["S",["$CONCAT",["N",["$CONCAT",["$MATCH","1"]]],["$CONCAT",["$CONCAT",["$CONCAT",["$LITERAL","+"]],["N",["$CONCAT",["$MATCH","2"]]]],["$CONCAT",["$CONCAT",["$LITERAL","-"]],["N",["$CONCAT",["$MATCH","2"]]]],["$CONCAT",["$CONCAT",["$LITERAL","-"]],["N",["$CONCAT",["$MATCH","4"]]]],["$CONCAT",["$CONCAT",["$LITERAL","-"]],["N",["$CONCAT",["$MATCH","6"]]]],["$CONCAT",["$CONCAT",["$LITERAL","+"]],["N",["$CONCAT",["$MATCH","2"]]]],["$CONCAT",["$CONCAT",["$LITERAL","+"]],["N",["$CONCAT",["$MATCH","6"]]]],["$CONCAT",["$CONCAT",["$LITERAL","-"]],["N",["$CONCAT",["$MATCH","2"]]]],["$CONCAT",["$CONCAT",["$LITERAL","+"]],["N",["$CONCAT",["$MATCH","5"]]]]]]],17,[]])
  })
  it('Analyzes arithmetic expressions on integers', () => {
    const tree = parser(`
      S = F [('+' | '-') Ws S];
      F = B [('*' | '/') Ws F];
      B = '(' Ws S ')' Ws | N;
      N = /\-?[0-9]+(\.[0-9]+)?/ Ws
        | /\-?\.[0-9]+/ Ws;
      Ws = {/[\ \t\n]/};
    `).S('-.31 + 3.41 * 2 / (1+4)')
    assert.deepEqual(tree, [["S",["$CONCAT",["F",["$CONCAT",["B",["$CONCAT",["N",["$CONCAT",["$MATCH","-.31"],["Ws",["$CONCAT",["$CONCAT",["$CONCAT",["$MATCH"," "]]]]]]]]],["$CONCAT"]]],["$CONCAT",["$CONCAT",["$LITERAL","+"]],["Ws",["$CONCAT",["$CONCAT",["$CONCAT",["$MATCH"," "]]]]],["S",["$CONCAT",["F",["$CONCAT",["B",["$CONCAT",["N",["$CONCAT",["$MATCH","3.41",".41"],["Ws",["$CONCAT",["$CONCAT",["$CONCAT",["$MATCH"," "]]]]]]]]],["$CONCAT",["$CONCAT",["$LITERAL","*"]],["Ws",["$CONCAT",["$CONCAT",["$CONCAT",["$MATCH"," "]]]]],["F",["$CONCAT",["B",["$CONCAT",["N",["$CONCAT",["$MATCH","2",null],["Ws",["$CONCAT",["$CONCAT",["$CONCAT",["$MATCH"," "]]]]]]]]],["$CONCAT",["$CONCAT",["$LITERAL","/"]],["Ws",["$CONCAT",["$CONCAT",["$CONCAT",["$MATCH"," "]]]]],["F",["$CONCAT",["B",["$CONCAT",["$LITERAL","("],["Ws",["$CONCAT",["$CONCAT"]]],["S",["$CONCAT",["F",["$CONCAT",["B",["$CONCAT",["N",["$CONCAT",["$MATCH","1+4","+4"],["Ws",["$CONCAT",["$CONCAT"]]]]]]],["$CONCAT"]]],["$CONCAT"]]],["$LITERAL",")"],["Ws",["$CONCAT",["$CONCAT"]]]]],["$CONCAT"]]]]]]]]],["$CONCAT"]]]]]],23,[]])
  })
  it('Analyzes a programming language grammar with no errors', () => {
    const tree = parser(`
      Program = [W] { Declaration };
      Declaration = 'export' W Definition ['as' W Id] ['from' W IdPath] | Definition;
      Definition = 'type' W CapitalId ['=' [W] Type];
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
    assert.deepEqual(tree, [["Program",["$CONCAT",["$CONCAT",["W",["$CONCAT",["Whitespace",["$CONCAT",["$MATCH","\n"]]],["$CONCAT"]]]],["$CONCAT",["$CONCAT",["Declaration",["$CONCAT",["$LITERAL","export"],["W",["$CONCAT",["Whitespace",["$CONCAT",["$MATCH"," "]]],["$CONCAT"]]],["Definition",["$CONCAT",["$LITERAL","type"],["W",["$CONCAT",["Whitespace",["$CONCAT",["$MATCH"," "]]],["$CONCAT"]]],["CapitalId",["$CONCAT",["$MATCH","MyType"],["$CONCAT",["W",["$CONCAT",["Whitespace",["$CONCAT",["$MATCH","\n"]]],["$CONCAT",["$CONCAT",["Whitespace",["$CONCAT",["$MATCH"," "]]]],["$CONCAT",["Whitespace",["$CONCAT",["$MATCH"," "]]]],["$CONCAT",["Whitespace",["$CONCAT",["$MATCH"," "]]]],["$CONCAT",["Whitespace",["$CONCAT",["$MATCH"," "]]]]]]]]]],["$CONCAT"]]],["$CONCAT"],["$CONCAT"]]]]]]],24,[]])
  })

  it('Analyzes a programming language grammar with grammar errors', () => {
    try {
      parser(`
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
      `)
    } catch ({ message }) {
      assert.deepEqual(message, `✘ 5:18 | Expected ';', got '= /[A-Z][a-zA-Z0-9_]*/ [W];\\n        Type...'`)
    }
  })
  it('Analyzes a programming language grammar with program errors', () => {
    const tree = parser(`
      Program = [W] { Declaration };
      Declaration = 'export' W Definition ['as' W Id] ['from' W IdPath] | Definition;
      Definition = 'type' W CapitalId ['=' [W] Type];
      CapitalId = /[A-Z][a-zA-Z0-9_]*/ [W];
      Type = CapitalId { CapitalId };
      Id = /[a-zA-Z_][a-zA-Z0-9_]*/ - Reserved [W];
      IdPath = Id { '::' Id };
      W = Whitespace { Whitespace };
      Whitespace = /[ \n\t]/;
      Reserved = 'type' | 'function' | 'module' | 'as' | 'from' | 'export' | 'import' | 'of' | 'in' | 'let' | 'private';
    `).Program(`
export type; MyType
    `)
    assert.deepEqual(tree, [['Program',['$CONCAT',['$CONCAT',['W',['$CONCAT',['Whitespace',['$CONCAT',['$MATCH','\n']]],['$CONCAT']]]],['$CONCAT']]],1,[]])
  })
  it('Analyzes a programming language grammar with two program errors', () => {
    const tree = parser(`
      Program = [W] { Declaration };
      Declaration = 'export' W Definition ['as' W Id] ['from' W IdPath] | Definition;
      Definition = 'type' W CapitalId ['=' [W] Type];
      CapitalId = /[A-Z][a-zA-Z0-9_]*/ [W];
      Type = CapitalId { CapitalId };
      Id = /[a-zA-Z_][a-zA-Z0-9_]*/ - Reserved [W];
      IdPath = Id { '::' Id };
      W = Whitespace { Whitespace };
      Whitespace = /[ \n\t]/;
      Reserved = 'type' | 'function' | 'module' | 'as' | 'from' | 'export' | 'import' | 'of' | 'in' | 'let' | 'private';
    `).Program(`
export; type; MyType
    `)
    assert.deepEqual(tree, [["Program",["$CONCAT",["$CONCAT",["W",["$CONCAT",["Whitespace",["$CONCAT",["$MATCH","\n"]]],["$CONCAT"]]]],["$CONCAT"]]],1,[]])
  })
})
