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
      assert.deepEqual(WS(' is a text', { errors }), [[WS.type], 'is a text'])
      assert.deepEqual(errors, [])
    })
    it('tests WS positive (when comment)', () => {
      const errors = []
      assert.deepEqual(WS('(* comment *)is a text', { errors }), [[WS.type], 'is a text'])
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
      assert.deepEqual(WSs('    is a text', { errors }), [[WSs.type], 'is a text'])
      assert.deepEqual(errors, [])
    })
    it('tests WSs negative', () => {
      const errors = []
      assert.deepEqual(WSs('this is a text', { errors }), [[WSs.type], 'this is a text'])
      assert.deepEqual(errors, [])
    })
  })

  describe('NT', () => {
    it('tests NT positive', () => {
      const errors = []
      assert.deepEqual(NT('this is a text', { errors }), [[NT.type, 'this'], 'is a text'])
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
      assert.deepEqual(Conc('12  *s$', { errors }), [[Conc.type.Repetition,'12','s'],'$'])
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
      assert.deepEqual(Conc('potato  *s$', { errors }), [[NT.type, 'potato'], '*s$'])
      assert.deepEqual(errors, [])
    })
    it('tests Conc positive (double quotes)', () => {
      const errors = []
      const expected = [[Conc.type.DblQuote, 'quotations'],'$']
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
      assert.deepEqual(Conc("'quotations' $", { errors }), [[Conc.type.SglQuote, 'quotations'], '$'])
      assert.deepEqual(errors, [])
    })
    it('tests Conc negative (single quotes)', () => {
      const errors = []
      assert.deepEqual(Conc("'quotations $", { original: "'quotations $", errors }), [[null], "'quotations $"])
      assert.deepEqual(errors, ["✘ 1:13 | Expected ''', got end of input"])
    })
    it('tests Conc positive (regex)', () => {
      const errors = []
      assert.deepEqual(Conc('/[]/ $', { errors }), [[Conc.type.Regex, '[]'], '$'])
      assert.deepEqual(errors, [])
    })
    it('tests Conc negative (regex)', () => {
      const errors = []
      assert.deepEqual(Conc('/[] $', { original: "/[] $", errors }), [[null], '/[] $'])
      assert.deepEqual(errors, ["✘ 1:5 | Expected '/', got end of input"])
    })
    it('tests Conc positive ([])', () => {
      const errors = []
      assert.deepEqual(Conc('[ potato]$', { errors }), [[Conc.type.Option,[Exp.type, [Disj.type,[Xcep.type,[NT.type,'potato']]]]],'$'])
      assert.deepEqual(errors, [])
    })
    it('tests Conc positive ([]) medium', () => {
      const errors = []
      assert.deepEqual(Conc('[ potato | banana]$', { errors }), [[Conc.type.Option,[Exp.type, [Disj.type,[Xcep.type,[NT.type,"potato"]]],[Disj.type,[Xcep.type,[NT.type,"banana"]]]]],"$"])
      assert.deepEqual(errors, [])
    })
    it('tests Conc positive ([]) long', () => {
      const errors = []
      assert.deepEqual(Conc('[ potato | banana | pineaple]$', { errors }), [[Conc.type.Option,[Exp.type, [Disj.type,[Xcep.type,[NT.type,"potato"]]],[Disj.type,[Xcep.type,[NT.type,"banana"]]], [Disj.type,[Xcep.type,[NT.type,"pineaple"]]]]],"$"])
      assert.deepEqual(errors, [])
    })
    it('tests Conc negative ([])', () => {
      const errors = []
      assert.deepEqual(Conc('[ potato$', { errors }), [[null], '[ potato$'])
      assert.deepEqual(errors, ["✘ 1:0 | Expected ']', got '$...'"])
    })
    it('tests Conc positive ({})', () => {
      const errors = []
      assert.deepEqual(Conc('{ potato}$', { errors }), [[Conc.type.Closure,[Exp.type, [Disj.type,[Xcep.type,[NT.type,'potato']]]]],'$'])
      assert.deepEqual(errors, [])
    })
    it('tests Conc negative ({})', () => {
      const errors = []
      assert.deepEqual(Conc('{ potato$', { errors }), [[null], '{ potato$'])
      assert.deepEqual(errors, ["✘ 1:0 | Expected '}', got '$...'"])
    })
    it('tests Conc positive (())', () => {
      const errors = []
      assert.deepEqual(Conc('( potato)$', { errors }), [[Conc.type.Group,[Exp.type, [Disj.type,[Xcep.type,[NT.type,'potato']]]]],'$'])
      assert.deepEqual(errors, [])
    })
    it('tests Conc negative (())', () => {
      const errors = []
      assert.deepEqual(Conc('( potato$', { errors }), [[null], '( potato$'])
      assert.deepEqual(errors, ["✘ 1:0 | Expected ')', got '$...'"])
    })
// //   // it('tests Conc positive (??)', () => {
// //   //  const errors = []
// //   //  assert.deepEqual(Conc('? potato?$', { errors, special: LITERAL(' potato') }), [['?', ' potato', '?', []], '$'])
// //   //  assert.deepEqual(errors, [])
// //   // })
// //   // it('tests Conc negative (?? - fail inner rule)', () => {
// //   //  const errors = []
// //   //  assert.deepEqual(Conc('? potato?$', { errors, special: LITERAL(' protato') }), [['Conc', null], '? potato?$'])
// //   //  assert.deepEqual(errors, ["✘ 1:0 | Expected 'special rule', got ' potato?$...'"])
// //   // })
// //   // it('tests Conc negative (?? - fail presence of ?)', () => {
// //   //  const errors = []
// //   //  assert.deepEqual(Conc('? potato$', { errors, special: LITERAL(' potato') }), [null, '? potato$'])
// //   //  assert.deepEqual(errors, ["✘ 1:0 | Expected '?', got '$...'"])
// //   // })
    it('tests Conc negative', () => {
      const errors = []
      assert.deepEqual(Conc('!$', { errors }), [[null], '!$'])
      assert.deepEqual(errors, [])
    })
  })
  describe('Xcep', () => {
    it('tests Xcep positive', () => {
      const errors = []
      assert.deepEqual(Xcep('ab c d$', { errors }), [[Xcep.type, [NT.type, 'ab'], [NT.type, 'c'], [NT.type, 'd']], '$'])
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
      assert.deepEqual(Disj('ab c d$', { errors }), [[Disj.type,[Xcep.type,[NT.type,'ab'],[NT.type,'c'],[NT.type,'d']]],'$'])
      assert.deepEqual(errors, [])
    })
    it('tests Disj positive (with except)', () => {
      const errors = []
      assert.deepEqual(Disj('ab c - potato$', { errors }), [[Disj.type,[Xcep.type,[NT.type,'ab'],[NT.type,'c']],[Xcep.type,[NT.type,'potato']]],'$'])
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
      assert.deepEqual(Exp('ab c$', { errors }), [[Exp.type,[Disj.type,[Xcep.type,[NT.type,'ab'],[NT.type,'c']]]],'$'])
      assert.deepEqual(errors, [])
    })
    it('tests Exp positive (many)', () => {
      const errors = []
      assert.deepEqual(Exp('ab c | potato | banana$', { errors }), [[Exp.type, [Disj.type, [Xcep.type, [NT.type, 'ab'], [NT.type, 'c']]], [Disj.type, [Xcep.type, [NT.type, 'potato']]], [Disj.type, [Xcep.type, [NT.type, 'banana']]]], '$'])
      assert.deepEqual(errors, [])
    })
    it('tests Exp negative', () => {
      const errors = []
      assert.deepEqual(Exp('12ab c$', { errors }), [[Exp.type, null], '12ab c$'])
      assert.deepEqual(errors, ["✘ 1:0 | Expected '*', got 'ab c$...'"])
    })
  })
  describe('Rule', () => {
    it('tests Rule positive', () => {
      const original = 'S = ab | c;'
      const errors = []
      assert.deepEqual(Rule(original, { original, errors }), [[Rule.type,'S',[Exp.type,[Disj.type,[Xcep.type,[NT.type,'ab']]],[Disj.type,[Xcep.type,[NT.type,'c']]]]],''])
      assert.deepEqual(errors, [])
    })
    it('tests Rule negative (missing ";")', () => {
      const original = 'S = ab | c'
      const errors = []
      assert.deepEqual(Rule(original, { original, errors }), [[null], 'S = ab | c'])
      assert.deepEqual(errors, ["✘ 1:10 | Expected ';', got end of input"])
    })
  })
  describe('EBNF', () => {
    it('tests EBNF positive', () => {
      const original = 'S = "ab" A | S "c"; A = "b" | /[0-9]+/ S;'
      const errors = []
      assert.deepEqual(EBNF(original, { original, errors }), [["$EBNF",["$Rule","S",["$Exp",["$Disj",["$Xcep",["$DblQuote","ab"],["$NT","A"]]],["$Disj",["$Xcep",["$NT","S"],["$DblQuote","c"]]]]],["$Rule","A",["$Exp",["$Disj",["$Xcep",["$DblQuote","b"]]],["$Disj",["$Xcep",["$Regex","[0-9]+"],["$NT","S"]]]]]],""])
      assert.deepEqual(errors, [])
    })
    it('tests EBNF negative (missing ";")', () => {
      const original = 'S ; "ab" A | S "c"; A = "b" | /[0-9]+/ S'
      const errors = []
      assert.deepEqual(EBNF(original, { original, errors }), [[EBNF.type], 'S ; "ab" A | S "c"; A = "b" | /[0-9]+/ S'])
      assert.deepEqual(errors, ["✘ 1:2 | Expected '=', got '; \"ab\" A | S \"c\"; A ...'"])
    })
    it('tests EBNF negative (wrong rule "=")', () => {
      const original = `S =
    "ab" A
    || S "c";
  A == "b"
    | /[0-9]+/ S;`
      const errors = []
      assert.deepEqual(EBNF(original, { original, errors }), [[EBNF.type], 'S =\n    "ab" A\n    || S "c";\n  A == "b"\n    | /[0-9]+/ S;'])
      assert.deepEqual(errors, ["✘ 3:5 | Expected 'Expression after \"|\"', got '| S \"c\";\\n  A == \"b\"\\n...'", "✘ 3:4 | Expected ';', got '|| S \"c\";\\n  A == \"b\"...'"])
    })
  })
})