const assert = require('assert')
const {
  WS,
  WSs,
  NT,
  Conc,
  Xcep,
  Disj,
  Exp,
  Rule,
  EBNF
} = require('../../lib/rules')
const { LITERAL } = require('../../lib/hoc')

describe('rules', () => {
  describe('WS', () => {
    it('tests WS positive', () => {
      const errors = []
      assert.deepEqual(WS(' is a text', { errors }), [['WS', true], 'is a text'])
      assert.deepEqual(errors, [])
    })
    it('tests WS positive (when comment)', () => {
      const errors = []
      assert.deepEqual(WS('(* comment *)is a text', { errors }), [['WS', true], 'is a text'])
      assert.deepEqual(errors, [])
    })
    it('tests WS negative', () => {
      const errors = []
      assert.deepEqual(WS('this is a text', { errors }), [[null], 'this is a text'])
      assert.deepEqual(errors, [])
    })
  })

  describe('WSs', () => {
    it('tests WSs positive', () => {
      const errors = []
      assert.deepEqual(WSs('    is a text', { errors }), [['WSs', true], 'is a text'])
      assert.deepEqual(errors, [])
    })
    it('tests WSs negative', () => {
      const errors = []
      assert.deepEqual(WSs('this is a text', { errors }), [['WSs', true], 'this is a text'])
      assert.deepEqual(errors, [])
    })
  })

  describe('NT', () => {
    it('tests NT positive', () => {
      const errors = []
      assert.deepEqual(NT('this is a text', { errors }), [['NT', 'this'], 'is a text'])
      assert.deepEqual(errors, [])
    })
    it('tests NT negative', () => {
      const errors = []
      assert.deepEqual(NT('$this is a text', { errors }), [[null], '$this is a text'])
      assert.deepEqual(errors, [])
    })
  })

  describe('Conc', () => {
    it('tests Conc positive (repetition)', () => {
      const errors = []
      const expected = [['Repetition',['12','s']],'$']
      assert.deepEqual(Conc('12  *s$', { errors }), expected)
      assert.deepEqual(errors, [])
    })
    it('tests Conc negative (repetition), on *', () => {
      const errors = []
      assert.deepEqual(Conc('12  s*2$', { errors }), [[null], '12  s*2$'])
      assert.deepEqual(errors, ["✘ 1:0 | Expected '*', got 's*2$...'"])
    })
    it('tests Conc negative (repetition), on NT', () => {
      const errors = []
      assert.deepEqual(Conc('12 *', { errors }), [[null], '12 *'])
      assert.deepEqual(errors, ["✘ 1:0 | Expected 'Non terminal', got end of input"])
    })
    it('tests Conc positive (NT)', () => {
      const errors = []
      assert.deepEqual(Conc('potato  *s$', { errors }), [['NT', 'potato'], '*s$'])
      assert.deepEqual(errors, [])
    })
    it('tests Conc positive (double quotes)', () => {
      const errors = []
      const expected = [['DblQuote', 'quotations'],'$']
      assert.deepEqual(Conc('"quotations" $', { errors }), expected)
      assert.deepEqual(errors, [])
    })
    it('tests Conc negative (double quotes)', () => {
      const errors = []
      assert.deepEqual(Conc('"quotations $', { original: '"quotations $', errors }), [[null], '"quotations $'])
      assert.deepEqual(errors, ["✘ 1:13 | Expected '\"', got end of input"])
    })
    it('tests Conc positive (single quotes)', () => {
      const errors = []
      assert.deepEqual(Conc("'quotations' $", { errors }), [['SglQuote', 'quotations'], '$'])
      assert.deepEqual(errors, [])
    })
    it('tests Conc negative (single quotes)', () => {
      const errors = []
      assert.deepEqual(Conc("'quotations $", { original: "'quotations $", errors }), [[null], "'quotations $"])
      assert.deepEqual(errors, ["✘ 1:13 | Expected ''', got end of input"])
    })
    it('tests Conc positive (regex)', () => {
      const errors = []
      assert.deepEqual(Conc('/[]/ $', { errors }), [['Regex', '[]'], '$'])
      assert.deepEqual(errors, [])
    })
    it('tests Conc negative (regex)', () => {
      const errors = []
      assert.deepEqual(Conc('/[] $', { original: "/[] $", errors }), [[null], '/[] $'])
      assert.deepEqual(errors, ["✘ 1:5 | Expected '/', got end of input"])
    })
    it('tests Conc positive ([])', () => {
      const errors = []
      assert.deepEqual(Conc('[ potato]$', { errors }), [['Option',[['Exception',[['Concatenation',[['NT','potato']]],null]]]],'$'])
      assert.deepEqual(errors, [])
    })
    it('tests Conc positive ([]) long', () => {
      const errors = []
      assert.deepEqual(Conc('[ potato | banana]$', { errors }), [["Option",[["Exception",[["Concatenation",[["NT","potato"]]],null]],["Exception",[["Concatenation",[["NT","banana"]]],null]]]],"$"])
      assert.deepEqual(errors, [])
    })
    it('tests Conc negative ([])', () => {
      const errors = []
      assert.deepEqual(Conc('[ potato$', { errors }), [[null], '[ potato$'])
      assert.deepEqual(errors, ["✘ 1:0 | Expected ']', got '$...'"])
    })
    it('tests Conc positive ({})', () => {
      const errors = []
      assert.deepEqual(Conc('{ potato}$', { errors }), [['Closure',[['Exception',[['Concatenation',[['NT','potato']]],null]]]],'$'])
      assert.deepEqual(errors, [])
    })
    it('tests Conc negative ({})', () => {
      const errors = []
      assert.deepEqual(Conc('{ potato$', { errors }), [[null], '{ potato$'])
      assert.deepEqual(errors, ["✘ 1:0 | Expected '}', got '$...'"])
    })
    it('tests Conc positive (())', () => {
      const errors = []
      assert.deepEqual(Conc('( potato)$', { errors }), [['Group',[['Exception',[['Concatenation',[['NT','potato']]],null]]]],'$'])
      assert.deepEqual(errors, [])
    })
    it('tests Conc negative (())', () => {
      const errors = []
      assert.deepEqual(Conc('( potato$', { errors }), [[null], '( potato$'])
      assert.deepEqual(errors, ["✘ 1:0 | Expected ')', got '$...'"])
    })
//   // it('tests Conc positive (??)', () => {
//   //  const errors = []
//   //  assert.deepEqual(Conc('? potato?$', { errors, special: LITERAL(' potato') }), [['?', ' potato', '?', []], '$'])
//   //  assert.deepEqual(errors, [])
//   // })
//   // it('tests Conc negative (?? - fail inner rule)', () => {
//   //  const errors = []
//   //  assert.deepEqual(Conc('? potato?$', { errors, special: LITERAL(' protato') }), [['Conc', null], '? potato?$'])
//   //  assert.deepEqual(errors, ["✘ 1:0 | Expected 'special rule', got ' potato?$...'"])
//   // })
//   // it('tests Conc negative (?? - fail presence of ?)', () => {
//   //  const errors = []
//   //  assert.deepEqual(Conc('? potato$', { errors, special: LITERAL(' potato') }), [null, '? potato$'])
//   //  assert.deepEqual(errors, ["✘ 1:0 | Expected '?', got '$...'"])
//   // })
    it('tests Conc negative', () => {
      const errors = []
      assert.deepEqual(Conc('!$', { errors }), [[null], '!$'])
      assert.deepEqual(errors, [])
    })
  })
  describe('WS', () => {
    it('tests Xcep positive', () => {
      const errors = []
      assert.deepEqual(Xcep('ab c d$', { errors }), [['Concatenation', [['NT', 'ab'], ['NT', 'c'], ['NT', 'd']]], '$'])
      assert.deepEqual(errors, [])
    })
    it('tests Xcep negative', () => {
      const errors = []
      assert.deepEqual(Xcep('12ab c d$', { errors }), [[null], '12ab c d$'])
      assert.deepEqual(errors, ["✘ 1:0 | Expected '*', got 'ab c d$...'"])
    })
  })
  describe('Disj', () => {
    it('tests Disj positive (no except)', () => {
      const errors = []
      assert.deepEqual(Disj('ab c d$', { errors }), [['Exception',[['Concatenation',[['NT','ab'],['NT','c'],['NT','d']]],null]],'$'])
      assert.deepEqual(errors, [])
    })
    it('tests Disj positive (with except)', () => {
      const errors = []
      assert.deepEqual(Disj('ab c - potato$', { errors }), [['Exception',[['Concatenation',[['NT','ab'],['NT','c']]],['Concatenation',[['NT','potato']]]]],'$'])
      assert.deepEqual(errors, [])
    })
    it('tests Disj negative', () => {
      const errors = []
      assert.deepEqual(Disj('12ab c$', { errors }), [[null], '12ab c$'])
      assert.deepEqual(errors, ["✘ 1:0 | Expected '*', got 'ab c$...'"])
    })
  })
  describe('Exp', () => {
    it('tests Exp positive (simple)', () => {
      const errors = []
      assert.deepEqual(Exp('ab c$', { errors }), [['Disjunction',[['Exception',[['Concatenation',[['NT','ab'],['NT','c']]],null]]]],'$'])
      assert.deepEqual(errors, [])
    })
    it('tests Exp positive (many)', () => {
      const errors = []
      assert.deepEqual(Exp('ab c | potato | banana$', { errors }), [['Disjunction', [['Exception', [['Concatenation', [['NT', 'ab'], ['NT', 'c']]], null]], ['Exception', [['Concatenation', [['NT', 'potato']]], null]], ['Exception', [['Concatenation', [['NT', 'banana']]], null]]]], '$'])
      assert.deepEqual(errors, [])
    })
    it('tests Exp negative', () => {
      const errors = []
      assert.deepEqual(Exp('12ab c$', { errors }), [['Disjunction', null], '12ab c$'])
      assert.deepEqual(errors, ["✘ 1:0 | Expected '*', got 'ab c$...'"])
    })
  })
  describe('Rule', () => {
    it('tests Rule positive', () => {
      const original = 'S = ab | c;'
      const errors = []
      assert.deepEqual(Rule(original, { original, errors }), [['Rule',[['Head', 'S'],['Body', ['Disjunction',[['Exception',[['Concatenation',[['NT','ab']]], null]],['Exception',[['Concatenation',[['NT','c']]], null]]]]]]],''])
      assert.deepEqual(errors, [])
    })
    it('tests Rule negative (missing ";")', () => {
      const original = 'S = ab | c'
      const errors = []
      assert.deepEqual(Rule(original, { original, errors }), [['Rule', null], 'S = ab | c'])
      assert.deepEqual(errors, ["✘ 1:10 | Expected ';', got end of input"])
    })
  })
  describe('EBNF', () => {
    it('tests EBNF positive', () => {
      const original = 'S = "ab" A | S "c"; A = "b" | /[0-9]+/ S;'
      const errors = []
      assert.deepEqual(EBNF(original, { original, errors }), [["EBNF",[["Rule",[["Head","S"],["Body",["Disjunction",[["Exception",[["Concatenation",[["DblQuote","ab"],["NT","A"]]],null]],["Exception",[["Concatenation",[["NT","S"],["DblQuote","c"]]],null]]]]]]],["Rule",[["Head","A"],["Body",["Disjunction",[["Exception",[["Concatenation",[["DblQuote","b"]]],null]],["Exception",[["Concatenation",[["Regex","[0-9]+"],["NT","S"]]],null]]]]]]]]],""])
      assert.deepEqual(errors, [])
    })
    it('tests EBNF negative (missing ";")', () => {
      const original = 'S ; "ab" A | S "c"; A = "b" | /[0-9]+/ S'
      const errors = []
      assert.deepEqual(EBNF(original, { original, errors }), [['EBNF', []], 'S ; "ab" A | S "c"; A = "b" | /[0-9]+/ S'])
      assert.deepEqual(errors, ["✘ 1:2 | Expected '=', got '; \"ab\" A | S \"c\"; A ...'"])
    })
    it('tests EBNF negative (wrong rule "=")', () => {
      const original = `S =
    "ab" A
    || S "c";
  A == "b"
    | /[0-9]+/ S;`
      const errors = []
      assert.deepEqual(EBNF(original, { original, errors }), [['EBNF', []], 'S =\n    "ab" A\n    || S "c";\n  A == "b"\n    | /[0-9]+/ S;'])
      assert.deepEqual(errors, ["✘ 3:5 | Expected 'Expression after \"|\"', got '| S \"c\";\\n  A == \"b\"\\n...'", "✘ 3:4 | Expected ';', got '|| S \"c\";\\n  A == \"b\"...'"])
    })
  })
})