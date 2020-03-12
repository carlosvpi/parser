const assert = require('assert')
const { parser } = require('../../lib/parser')
const { getTraverser } = require('../../lib/traverse')

describe('parser module', () => {
  it('Analyzes arithmetic expressions on integers', () => {
    const sParser = parser(`
      S = N { ( '+' | '-' ) N };
      N = /[0-9]+/;
    `)
    const tree = sParser.S('1+2')
    const operate = getTraverser({
      S: (nodes) => nodes[0] + (nodes[1] === '-' ? -1 : 1) * (nodes[2] || 0),
      N: (value) => +value[0]
    })
    assert.deepEqual(operate(tree), 3)
  })
  it('Analyzes arithmetic expressions on integers', () => {
    const sParser = parser(`
      S = F [('+' | '-') Ws S];
      F = B [('*' | '/') Ws F];
      B = '(' Ws S ')' Ws | N;
      N = /\-?[0-9]+/ Ws
        | /\-?\.[0-9]+/ Ws;
      Ws = {/[\ \t\n]/};
    `)
    const tree = sParser.S('-1 + 3 * 15 / (1+4)')
    const operate = getTraverser({
      S: ([s1, op, s2]) =>  op === '-' ? s1 - s2
                          : op === '+' ? s1 + s2
                          : s1,
      F: ([f1, op, f2]) =>  op === '/' ? f1 / f2
                          : op === '*' ? f1 * f2
                          : f1,
      B: ([ob, value]) => ob ==='(' ? value : ob,
      N: ([value]) => +value
    })
    assert.deepEqual(operate(tree), 8)
  })
})
