const assert = require('assert')
const {
  MATCH,
  LITERAL,
  CONCAT,
  DISJUNCTION,
  OPTION,
  CLOSURE,
  REPETITION,
  EXCEPTION,
  expect
} = require('../../lib/hoc');

describe('hoc', () => {
  const input = 'this is a text'

  describe('LITERAL', () => {
    it('tests LITERAL positive', () => {
      assert.deepEqual(LITERAL('this')(input,0), [[LITERAL.type, 'this'], 4, []])
    })
    it('tests LITERAL negative', () => {
      assert.deepEqual(LITERAL('that')(input,0), [[null], 0, ["✘ 1:0 | Expected 'that', got 'this is a text...'"]])
    })
  })

  describe('MATCH', () => {
    it('tests MATCH positive', () => {
      assert.deepEqual(MATCH(/\w+/)(input,0), [[MATCH.type, 'this'], 4, []])
    })
    it('tests MATCH negative', () => {
      assert.deepEqual(MATCH(/[q]h?i\w/)(input,0), [[null], 0, ["✘ 1:0 | Expected '/[q]h?i\\w/', got 'this is a text...'"]])
    })
  })

  describe('CONCAT', () => {
    it('tests CONCAT positive', () => {
      assert.deepEqual(CONCAT(
        LITERAL('this'),
        MATCH(/[ \t\n]/),
        LITERAL('is'),
      )(input,0), [[CONCAT.type, [LITERAL.type, 'this'], [MATCH.type, ' '], [LITERAL.type, 'is']], 7, []])
    })
    it('tests CONCAT negative', () => {
      assert.deepEqual(CONCAT(
        LITERAL('this'),
        MATCH(/[ \t\n]/),
        LITERAL('was'),
      )(input,0), [[null], 5, ["✘ 1:5 | Expected 'was', got 'is a text...'"]])
    })
  })

  describe('DISJUNCTION', () => {
    it('tests DISJUNCTION positive', () => {
      assert.deepEqual(DISJUNCTION(
        LITERAL('this'),
        LITERAL('that'),
      )(input,0), [[LITERAL.type, 'this'], 4, []])
    })
    it('tests DISJUNCTION deep positive', () => {
      assert.deepEqual(DISJUNCTION(
        CONCAT(LITERAL('this'), LITERAL(' '), LITERAL('was')),
        CONCAT(LITERAL('this'), LITERAL(' '), LITERAL('is')),
      )(input,0), [['$CONCAT',['$LITERAL','this'],['$LITERAL',' '],['$LITERAL','is']],7,[]])
    })
    it('tests DISJUNCTION negative', () => {
      assert.deepEqual(DISJUNCTION(
        LITERAL('these'),
        LITERAL('that'),
      )(input,0), [[null], 0, ["✘ 1:0 | Expected 'that', got 'this is a text...'"]])
    })
    it('tests DISJUNCTION deep negative', () => {
      assert.deepEqual(DISJUNCTION(
        CONCAT(LITERAL('this'), LITERAL(' '), LITERAL('was')),
        CONCAT(LITERAL('this'), LITERAL(' '), LITERAL('will')),
      )(input,0), [[null], 5, ["✘ 1:5 | Expected 'will', got 'is a text...'"]])
    })
  })

  describe('OPTION', () => {
    it('tests OPTION positive', () => {
      assert.deepEqual(OPTION(
        LITERAL('this')
      )(input,0), [[LITERAL.type, 'this'], 4, []])
    })
    it('tests OPTION negative', () => {
      assert.deepEqual(OPTION(
        LITERAL('that')
      )(input,0), [[CONCAT.type], 0, []])
    })
  })

  describe('CLOSURE', () => {
    it('tests CLOSURE positive', () => {
      assert.deepEqual(CLOSURE(
        MATCH(/\w/)
      )(input,0), [[CONCAT.type, [MATCH.type, 't'],[MATCH.type, 'h'],[MATCH.type, 'i'],[MATCH.type, 's']], 4, []])
    })
    it('tests CLOSURE negative', () => {
      assert.deepEqual(CLOSURE(
        MATCH('\W')
      )(input,0), [[CONCAT.type], 0, []])
    })
  })

  describe('REPETITION', () => {
    it('tests REPETITION positive', () => {
      assert.deepEqual(REPETITION(
        4, MATCH(/\w/)
      )(input,0), [[CONCAT.type, [MATCH.type, 't'],[MATCH.type, 'h'],[MATCH.type, 'i'],[MATCH.type, 's']], 4, []])
    })
    it('tests REPETITION negative', () => {
      assert.deepEqual(REPETITION(
        5, MATCH('\W')
      )(input,0), [[null], 0, ["✘ 1:0 | Expected 'W', got 'this is a text...'"]])
    })
  })

  describe('EXCEPTION', () => {
    it('tests EXCEPTION positive', () => {
      assert.deepEqual(EXCEPTION(
        MATCH(/\w+/), LITERAL('that')
      )(input,0), [[MATCH.type, 'this'], 4, []])
    })
    it('tests EXCEPTION negative', () => {
      assert.deepEqual(EXCEPTION(
        MATCH(/\w+/), LITERAL('this')
      )(input,0), [[null], 0, ["✘ 1:0 | Expected 'not to fit an exception rule', got 'this is a text...'"]])
    })
  })

  describe('expect', () => {
    it('tests expect positive', () => {
      assert.deepEqual(expect('this')(input,0), "✘ 1:0 | Expected 'this', got 'this is a text...'")
    })
    it('tests expect negative', () => {
      const input = `
      this
  is
a
    test
`
      assert.deepEqual(expect('that')(input,7), "✘ 2:6 | Expected 'that', got 'this\\n  is\\na\\n    test\\n...'")
      assert.deepEqual(expect('This')('', 28), "✘ 1:0 | Expected 'This', got end of input")
    })
  })
})
