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
      assert.deepEqual(WS(' is a text', 0, errors), [[WS.type, ' '], 1])
      assert.deepEqual(errors, [])
    })
    it('tests WS positive (when comment)', () => {
      const errors = []
      assert.deepEqual(WS('(* comment *)is a text', 0, errors), [[WS.type, "(* comment *)"], 13])
      assert.deepEqual(errors, [])
    })
    it('tests WS positive (when comment 2)', () => {
      const errors = []
      assert.deepEqual(WS('(* comment * after times *)is a text', 0, errors), [[WS.type, "(* comment * after times *)"], 27])
      assert.deepEqual(errors, [])
    })
    it('tests WS negative', () => {
      const errors = []
      assert.deepEqual(WS('this is a text', 0, errors), [[null], 0])
      assert.deepEqual(errors, [])
    })
  })

  describe('WSs', () => {
    it('tests WSs positive', () => {
      const errors = []
      assert.deepEqual(WSs('    is a text', 0, errors), [[WSs.type], 4])
      assert.deepEqual(errors, [])
    })
    it('tests WSs negative', () => {
      const errors = []
      assert.deepEqual(WSs('this is a text', 0, errors), [[WSs.type], 0])
      assert.deepEqual(errors, [])
    })
  })

  describe('NT', () => {
    it('tests NT positive', () => {
      const errors = []
      assert.deepEqual(NT('this is a text', 0, errors), [[NT.type, 'this'], 5])
      assert.deepEqual(errors, [])
    })
    it('tests NT negative', () => {
      const errors = []
      assert.deepEqual(NT('$this is a text', 0, errors), [[null], 0])
      assert.deepEqual(errors, [])
    })
  })

  describe('Conc', () => {
    it('tests Conc positive (repetition)', () => {
      const errors = []
      assert.deepEqual(Conc('12  *s$', 0, errors), [[Conc.type.Repetition,'12','s'], 6])
      assert.deepEqual(errors, [])
    })
    it('tests Conc negative (repetition), on *', () => {
      const errors = []
      assert.deepEqual(Conc('12  s*2$', 0, errors), [[null], 0])
      assert.deepEqual(errors, ["✘ 1:4 | Expected '*', got 's*2$...'", "✘ 1:6 | Expected 'Non terminal', got '2$...'"])
    })
    it('tests Conc negative (repetition), on NT', () => {
      const errors = []
      assert.deepEqual(Conc('12 *', 0, errors), [[null], 0])
      assert.deepEqual(errors, ["✘ 1:4 | Expected 'Non terminal', got end of input"])
    })
    it('tests Conc positive (NT)', () => {
      const errors = []
      assert.deepEqual(Conc('potato  *s$', 0, errors), [[NT.type, 'potato'], 8])
      assert.deepEqual(errors, [])
    })
    it('tests Conc positive (double quotes)', () => {
      const errors = []
      const expected = [[Conc.type.DblQuote, 'quotations'],13]
      assert.deepEqual(Conc('"quotations" $', 0, errors), expected)
      assert.deepEqual(errors, [])
    })
    it('tests Conc positive (double quotes) with escaped \"', () => {
      const errors = []
      const expected = [[Conc.type.DblQuote, 'quotat\\"ions'],15]
      assert.deepEqual(Conc('"quotat\\"ions" $', 0, errors), expected)
      assert.deepEqual(errors, [])
    })
    it('tests Conc negative (double quotes)', () => {
      const errors = []
      assert.deepEqual(Conc('"quotations $', 0, errors), [[null], 0])
      assert.deepEqual(errors, ["✘ 1:13 | Expected '\"', got end of input"])
    })
    it('tests Conc positive (single quotes)', () => {
      const errors = []
      assert.deepEqual(Conc("'quotations' $", 0, errors), [[Conc.type.SglQuote, 'quotations'], 13])
      assert.deepEqual(errors, [])
    })
    it('tests Conc positive (single quotes) with escaped \'', () => {
      const errors = []
      const expected = [[Conc.type.DblQuote, 'quotat\\\'ions'],15]
      assert.deepEqual(Conc('"quotat\\\'ions" $', 0, errors), expected)
      assert.deepEqual(errors, [])
    })
    it('tests Conc negative (single quotes)', () => {
      const errors = []
      assert.deepEqual(Conc("'quotations $", 0, errors), [[null], 0])
      assert.deepEqual(errors, ["✘ 1:13 | Expected ''', got end of input"])
    })
    it('tests Conc positive (regex)', () => {
      const errors = []
      assert.deepEqual(Conc('/[]/ $', 0, errors), [[Conc.type.Regex, '[]'], 5])
      assert.deepEqual(errors, [])
    })
    it('tests Conc positive (regex) with escaped \\/', () => {
      const errors = []
      assert.deepEqual(Conc('/[\\/]/ $', 0, errors), [[Conc.type.Regex, '[\\/]'], 7])
      assert.deepEqual(errors, [])
    })
    it('tests Conc negative (regex)', () => {
      const errors = []
      assert.deepEqual(Conc('/[] $', 0, errors), [[null], 0])
      assert.deepEqual(errors, ["✘ 1:5 | Expected '/', got end of input"])
    })
    it('tests Conc positive ([])', () => {
      const errors = []
      assert.deepEqual(Conc('[ potato]$', 0, errors), [[Conc.type.Option,[Exp.type, [Disj.type,[Xcep.type,[NT.type,'potato']]]]],9])
      assert.deepEqual(errors, [])
    })
    it('tests Conc positive ([]) medium', () => {
      const errors = []
      assert.deepEqual(Conc('[ potato | banana]$', 0, errors), [[Conc.type.Option,[Exp.type, [Disj.type,[Xcep.type,[NT.type,"potato"]]],[Disj.type,[Xcep.type,[NT.type,"banana"]]]]],18])
      assert.deepEqual(errors, [])
    })
    it('tests Conc positive ([]) long', () => {
      const errors = []
      assert.deepEqual(Conc('[ potato | banana | pineaple]$', 0, errors), [[Conc.type.Option,[Exp.type, [Disj.type,[Xcep.type,[NT.type,"potato"]]],[Disj.type,[Xcep.type,[NT.type,"banana"]]], [Disj.type,[Xcep.type,[NT.type,"pineaple"]]]]],29])
      assert.deepEqual(errors, [])
    })
    it('tests Conc negative ([])', () => {
      const errors = []
      assert.deepEqual(Conc('[ potato$', 0, errors), [[null], 0])
      assert.deepEqual(errors, ["✘ 1:8 | Expected ']', got '$...'"])
    })
    it('tests Conc positive ({})', () => {
      const errors = []
      assert.deepEqual(Conc('{ potato}$', 0, errors), [[Conc.type.Closure,[Exp.type, [Disj.type,[Xcep.type,[NT.type,'potato']]]]],9])
      assert.deepEqual(errors, [])
    })
    it('tests Conc negative ({})', () => {
      const errors = []
      assert.deepEqual(Conc('{ potato$', 0, errors), [[null], 0])
      assert.deepEqual(errors, ["✘ 1:8 | Expected '}', got '$...'"])
    })
    it('tests Conc positive (())', () => {
      const errors = []
      assert.deepEqual(Conc('( potato)$', 0, errors), [[Conc.type.Group,[Exp.type, [Disj.type,[Xcep.type,[NT.type,'potato']]]]],9])
      assert.deepEqual(errors, [])
    })
    it('tests Conc negative (())', () => {
      const errors = []
      assert.deepEqual(Conc('( potato$', 0, errors), [[null], 0])
      assert.deepEqual(errors, ["✘ 1:8 | Expected ')', got '$...'"])
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
      assert.deepEqual(Conc('!$', 0, errors), [[null], 0])
      assert.deepEqual(errors, [])
    })
  })
  describe('Xcep', () => {
    it('tests Xcep positive', () => {
      const errors = []
      assert.deepEqual(Xcep('ab c d$', 0, errors), [[Xcep.type, [NT.type, 'ab'], [NT.type, 'c'], [NT.type, 'd']], 6])
      assert.deepEqual(errors, [])
    })
    it('tests Xcep negative', () => {
      const errors = []
      assert.deepEqual(Xcep('12ab c d$', 0, errors), [[null], 0])
      assert.deepEqual(errors, ["✘ 1:2 | Expected '*', got 'ab c d$...'"])
    })
  })
  describe('Disj', () => {
    it('tests Disj positive (no except)', () => {
      const errors = []
      assert.deepEqual(Disj('ab c d$', 0, errors), [[Disj.type,[Xcep.type,[NT.type,'ab'],[NT.type,'c'],[NT.type,'d']]],6])
      assert.deepEqual(errors, [])
    })
    it('tests Disj positive (with except)', () => {
      const errors = []
      assert.deepEqual(Disj('ab c - potato$', 0, errors), [[Disj.type,[Xcep.type,[NT.type,'ab'],[NT.type,'c']],[Xcep.type,[NT.type,'potato']]],13])
      assert.deepEqual(errors, [])
    })
    it('tests Disj negative', () => {
      const errors = []
      assert.deepEqual(Disj('12ab c$', 0, errors), [[null], 0])
      assert.deepEqual(errors, ["✘ 1:2 | Expected '*', got 'ab c$...'"])
    })
  })
  describe('Exp', () => {
    it('tests Exp positive (simple)', () => {
      const errors = []
      assert.deepEqual(Exp('ab c$', 0, errors), [[Exp.type,[Disj.type,[Xcep.type,[NT.type,'ab'],[NT.type,'c']]]],4])
      assert.deepEqual(errors, [])
    })
    it('tests Exp positive (many)', () => {
      const errors = []
      assert.deepEqual(Exp('ab c | potato | banana$', 0, errors), [[Exp.type, [Disj.type, [Xcep.type, [NT.type, 'ab'], [NT.type, 'c']]], [Disj.type, [Xcep.type, [NT.type, 'potato']]], [Disj.type, [Xcep.type, [NT.type, 'banana']]]], 22])
      assert.deepEqual(errors, [])
    })
    it('tests Exp negative', () => {
      const errors = []
      assert.deepEqual(Exp('12ab c$', 0, errors), [[Exp.type, null], 0])
      assert.deepEqual(errors, ["✘ 1:2 | Expected '*', got 'ab c$...'"])
    })
  })
  describe('Rule', () => {
    it('tests Rule positive', () => {
      const original = 'S = ab | c;'
      const errors = []
      assert.deepEqual(Rule(original, 0, errors), [[Rule.type,'S',[Exp.type,[Disj.type,[Xcep.type,[NT.type,'ab']]],[Disj.type,[Xcep.type,[NT.type,'c']]]]],11])
      assert.deepEqual(errors, [])
    })
    it('tests Rule negative (missing ";")', () => {
      const original = 'S = ab | c'
      const errors = []
      assert.deepEqual(Rule(original, 0, errors), [[null], 0])
      assert.deepEqual(errors, ["✘ 1:10 | Expected ';', got end of input"])
    })
  })
  describe('EBNF', () => {
    it('tests EBNF positive', () => {
      const original = 'S = "ab" A | S "c"; A = "b" | /[0-9]+/ S;'
      const errors = []
      assert.deepEqual(EBNF(original, 0, errors), [["$EBNF",["$Rule","S",["$Exp",["$Disj",["$Xcep",["$DblQuote","ab"],["$NT","A"]]],["$Disj",["$Xcep",["$NT","S"],["$DblQuote","c"]]]]],["$Rule","A",["$Exp",["$Disj",["$Xcep",["$DblQuote","b"]]],["$Disj",["$Xcep",["$Regex","[0-9]+"],["$NT","S"]]]]]],41])
      assert.deepEqual(errors, [])
    })
    it('tests EBNF negative (missing ";")', () => {
      const original = 'S ; "ab" A | S "c"; A = "b" | /[0-9]+/ S'
      const errors = []
      assert.deepEqual(EBNF(original, 0, errors), [[EBNF.type], 0])
      assert.deepEqual(errors, ["✘ 1:2 | Expected '=', got '; \"ab\" A | S \"c\"; A = \"b\" | /[0-9]+/ S...'", "✘ 1:40 | Expected ';', got end of input"])
    })
    it('tests EBNF negative (wrong rule "=")', () => {
      const original = `S =
    "ab" A
    || S "c";
  A == "b"
    | /[0-9]+/ S;`
      const errors = []
      assert.deepEqual(EBNF(original, 0, errors), [["$EBNF",["$Rule","S",["$Exp",["$Disj",["$Xcep",["$DblQuote","ab"],["$NT","A"]]],["$Disj",["$Xcep",["$NT","S"],["$DblQuote","c"]]]]],["$Rule","A",["$Exp",null]]],57])
      assert.deepEqual(errors, ["✘ 3:5 | Expected 'Expression after \"|\"', got '| S \"c\";\\n  A == \"b\"\\n    | /[0-9]+/ S;...'", "✘ 4:5 | Expected ';', got '= \"b\"\\n    | /[0-9]+/ S;...'"])
    })
  })
})