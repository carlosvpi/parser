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
  EXPECT
} = require('../../lib/hoc')

describe('hoc', () => {
  const input = 'this is a text'

  describe('LITERAL', () => {
    it('tests LITERAL positive', () => {
      assert.deepEqual(LITERAL('this')(input,0), [[LITERAL.type, 'this'], 4, []])
    })
    it('tests LITERAL negative', () => {
      assert.deepEqual(LITERAL('that')(input,0), [[null], 0, []])
    })
  })

  describe('MATCH', () => {
    it('tests MATCH positive', () => {
      assert.deepEqual(MATCH(/\w+/)(input,0), [[MATCH.type, 'this'], 4, []])
    })
    it('tests MATCH negative', () => {
      assert.deepEqual(MATCH(/[q]h?i\w/)(input,0), [[null], 0, []])
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
      )(input,0), [[null], 0, []])
    })
  })

  describe('DISJUNCTION', () => {
    it('tests DISJUNCTION positive', () => {
      assert.deepEqual(DISJUNCTION(
        LITERAL('this'),
        LITERAL('that'),
      )(input,0), [[LITERAL.type, 'this'], 4, []])
    })
    it('tests DISJUNCTION negative', () => {
      assert.deepEqual(DISJUNCTION(
        LITERAL('these'),
        LITERAL('that'),
      )(input,0), [[null], 0, []])
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
      )(input,0), [[null], 0, []])
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
      )(input,0), [[null], 0, []])
    })
  })

  describe('EXPECT', () => {
    it('tests EXPECT positive', () => {
      assert.deepEqual(EXPECT(
        LITERAL('this'),
        'this'
      )(input,0), [[LITERAL.type, 'this'], 4, []])
    })
    it('tests EXPECT negative', () => {
      const input = `
      this
  is
a
    test
`
      assert.deepEqual(EXPECT(
        LITERAL('that'),
        ['that'],
      )(input,7), [[null], 28, ["✘ 2:6 | Expected 'that', got 'this\\n  is\\na\\n    test\\n...'"]])
      assert.deepEqual(EXPECT(
        LITERAL('This'),
        ['This'],
      )('', 28), [[null], 28, ["✘ 1:0 | Expected 'This', got end of input"]])
    })
  })
})
