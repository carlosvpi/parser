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
      assert.deepEqual(WS(' is a text', 0), [[WS.type, ' '], 1, []])
    })
    it('tests WS positive (when comment)', () => {
      assert.deepEqual(WS('(* comment *)is a text', 0), [[WS.type, "(* comment *)"], 13, []])
    })
    it('tests WS positive (when comment 2)', () => {
      assert.deepEqual(WS('(* comment * after times *)is a text', 0), [[WS.type, "(* comment * after times *)"], 27, []])
    })
    it('tests WS negative', () => {
      assert.deepEqual(WS('this is a text', 0), [[null], 0, ["✘ 1:0 | Expected '/([\\ \\n\\t]|\\(\\*([^\\*]|\\*(?!\\)))*\\*\\))/', got 'this is a text...'"]])
    })
  })

  describe('WSs', () => {
    it('tests WSs positive', () => {
      assert.deepEqual(WSs('    is a text', 0), [[WSs.type], 4, []])
    })
    it('tests WSs negative', () => {
      assert.deepEqual(WSs('this is a text', 0), [[WSs.type], 0, []])
    })
  })

  describe('NT', () => {
    it('tests NT positive', () => {
      assert.deepEqual(NT('this is a text', 0), [[NT.type, 'this'], 5, []])
    })
    it('tests NT negative', () => {
      assert.deepEqual(NT('$this is a text', 0), [[null], 0, ["✘ 1:0 | Expected '/[a-zA-Z_][a-zA-Z0-9_]*/', got '$this is a text...'"]])
    })
  })

  describe('Conc', () => {
    it('tests Conc positive (repetition)', () => {
      assert.deepEqual(Conc('12  *s$', 0), [[Conc.type.Repetition,'12','s'], 6,[]])
    })
    it('tests Conc negative (repetition), on *', () => {
      assert.deepEqual(Conc('12  s*2$', 0), [[null], 4, ["✘ 1:4 | Expected '*', got 's*2$...'"]])
    })
    it('tests Conc negative (repetition), on NT', () => {
      assert.deepEqual(Conc('12 *', 0), [[null], 4, ["✘ 1:4 | Expected '/[a-zA-Z_][a-zA-Z0-9_]*/', got end of input"]])
    })
    it('tests Conc positive (NT)', () => {
      assert.deepEqual(Conc('potato  *s$', 0), [[NT.type, 'potato'], 8, []])
    })
    it('tests Conc positive (double quotes)', () => {
      assert.deepEqual(Conc('"quotations" $', 0), [[Conc.type.DblQuote, 'quotations'],13, []])
    })
    it('tests Conc positive (double quotes) with escaped \"', () => {
      assert.deepEqual(Conc('"quotat\\"ions" $', 0), [[Conc.type.DblQuote, 'quotat\\"ions'],15,[]])
    })
    it('tests Conc negative (double quotes)', () => {
      assert.deepEqual(Conc('"quotations $', 0), [[null], 13, ["✘ 1:13 | Expected '\"', got end of input"]])
    })
    it('tests Conc positive (single quotes)', () => {
      assert.deepEqual(Conc("'quotations' $", 0), [[Conc.type.SglQuote, 'quotations'], 13, []])
    })
    it('tests Conc positive (single quotes) with escaped \'', () => {
      assert.deepEqual(Conc('"quotat\\\'ions" $', 0), [[Conc.type.DblQuote, 'quotat\\\'ions'],15, []])
    })
    it('tests Conc negative (single quotes)', () => {
      assert.deepEqual(Conc("'quotations $", 0), [[null], 13, ["✘ 1:13 | Expected ''', got end of input"]])
    })
    it('tests Conc positive (regex)', () => {
      assert.deepEqual(Conc('/[]/ $', 0), [[Conc.type.Regex, '[]'], 5, []])
    })
    it('tests Conc positive (regex) with escaped \\/', () => {
      assert.deepEqual(Conc('/[\\/]/ $', 0), [[Conc.type.Regex, '[\\/]'], 7, []])
    })
    it('tests Conc negative (regex)', () => {
      assert.deepEqual(Conc('/[] $', 0), [[null], 5, ["✘ 1:5 | Expected '/', got end of input"]])
    })
    it('tests Conc positive ([])', () => {
      assert.deepEqual(Conc('[ potato]$', 0), [[Conc.type.Option,[Exp.type, [Disj.type,[Xcep.type,[NT.type,'potato']]]]],9,[]])
    })
    it('tests Conc positive ([]) medium', () => {
      assert.deepEqual(Conc('[ potato | banana]$', 0), [[Conc.type.Option,[Exp.type, [Disj.type,[Xcep.type,[NT.type,"potato"]]],[Disj.type,[Xcep.type,[NT.type,"banana"]]]]],18,[]])
    })
    it('tests Conc positive ([]) long', () => {
      assert.deepEqual(Conc('[ potato | banana | pineaple]$', 0), [[Conc.type.Option,[Exp.type, [Disj.type,[Xcep.type,[NT.type,"potato"]]],[Disj.type,[Xcep.type,[NT.type,"banana"]]], [Disj.type,[Xcep.type,[NT.type,"pineaple"]]]]],29,[]])
    })
    it('tests Conc negative ([])', () => {
      assert.deepEqual(Conc('[ potato$', 0), [[null], 8, ["✘ 1:8 | Expected ']', got '$...'"]])
    })
    it('tests Conc positive ({})', () => {
      assert.deepEqual(Conc('{ potato}$', 0), [[Conc.type.Closure,[Exp.type, [Disj.type,[Xcep.type,[NT.type,'potato']]]]],9,[]])
    })
    it('tests Conc negative ({})', () => {
      assert.deepEqual(Conc('{ potato$', 0), [[null], 8,["✘ 1:8 | Expected '}', got '$...'"]])
    })
    it('tests Conc positive (())', () => {
      assert.deepEqual(Conc('( potato)$', 0), [[Conc.type.Group,[Exp.type, [Disj.type,[Xcep.type,[NT.type,'potato']]]]],9,[]])
    })
    it('tests Conc negative (())', () => {
      assert.deepEqual(Conc('( potato$', 0), [[null], 8, ["✘ 1:8 | Expected ')', got '$...'"]])
    })
  // it('tests Conc positive (??)', () => {
  //  assert.deepEqual(Conc('? potato?$', { errors, special: LITERAL(' potato') }), [['?', ' potato', '?', []], '$'])
  // })
  // it('tests Conc negative (?? - fail inner rule)', () => {
  //  assert.deepEqual(Conc('? potato?$', { errors, special: LITERAL(' protato') }), [['Conc', null], '? potato?$'])
  //  assert.deepEqual(errors, ["✘ 1:0 | Expected 'special rule', got ' potato?$...'"])
  // })
  // it('tests Conc negative (?? - fail presence of ?)', () => {
  //  assert.deepEqual(Conc('? potato$', { errors, special: LITERAL(' potato') }), [null, '? potato$'])
  //  assert.deepEqual(errors, ["✘ 1:0 | Expected '?', got '$...'"])
  // })
    it('tests Conc negative', () => {
      assert.deepEqual(Conc('!$', 0), [[null], 0, ["✘ 1:0 | Expected '?', got '!$...'"]])
    })
  })
  describe('Xcep', () => {
    it('tests Xcep positive', () => {
      assert.deepEqual(Xcep('ab c d$', 0), [[Xcep.type, [NT.type, 'ab'], [NT.type, 'c'], [NT.type, 'd']], 6, []])
    })
    it('tests Xcep negative', () => {
      assert.deepEqual(Xcep('12ab c d$', 0), [[null], 0, ["✘ 1:2 | Expected '*', got 'ab c d$...'"]])
    })
  })
  describe('Disj', () => {
    it('tests Disj positive (no except)', () => {
      assert.deepEqual(Disj('ab c d$', 0), [[Disj.type,[Xcep.type,[NT.type,'ab'],[NT.type,'c'],[NT.type,'d']]],6,[]])
    })
    it('tests Disj positive (with except)', () => {
      assert.deepEqual(Disj('ab c - potato$', 0), [[Disj.type,[Xcep.type,[NT.type,'ab'],[NT.type,'c']],[Xcep.type,[NT.type,'potato']]],13,[]])
    })
    it('tests Disj negative', () => {
      assert.deepEqual(Disj('12ab c$', 0), [[null], 0, ["✘ 1:2 | Expected '*', got 'ab c$...'"]])
    })
  })
  describe('Exp', () => {
    it('tests Exp positive (simple)', () => {
      assert.deepEqual(Exp('ab c$', 0), [[Exp.type,[Disj.type,[Xcep.type,[NT.type,'ab'],[NT.type,'c']]]],4,[]])
    })
    it('tests Exp positive (many)', () => {
      assert.deepEqual(Exp('ab c | potato | banana$', 0), [[Exp.type, [Disj.type, [Xcep.type, [NT.type, 'ab'], [NT.type, 'c']]], [Disj.type, [Xcep.type, [NT.type, 'potato']]], [Disj.type, [Xcep.type, [NT.type, 'banana']]]], 22, []])
    })
    it('tests Exp negative', () => {
      assert.deepEqual(Exp('12ab c$', 0), [[Exp.type, null], 0, ["✘ 1:2 | Expected '*', got 'ab c$...'"]])
    })
  })
  describe('Rule', () => {
    it('tests Rule positive', () => {
      assert.deepEqual(Rule('S = ab | c;', 0), [[Rule.type,'S',[Exp.type,[Disj.type,[Xcep.type,[NT.type,'ab']]],[Disj.type,[Xcep.type,[NT.type,'c']]]]],11, []])
    })
    it('tests Rule negative (missing ";")', () => {
      assert.deepEqual(Rule('S = ab | c', 0), [[null], 0, ["✘ 1:10 | Expected ';', got end of input"]])
    })
  })
  describe('EBNF', () => {
    it('tests EBNF positive', () => {
      assert.deepEqual(EBNF('S = "ab" A | S "c"; A = "b" | /[0-9]+/ S;', 0), [["$EBNF",["$Rule","S",["$Exp",["$Disj",["$Xcep",["$DblQuote","ab"],["$NT","A"]]],["$Disj",["$Xcep",["$NT","S"],["$DblQuote","c"]]]]],["$Rule","A",["$Exp",["$Disj",["$Xcep",["$DblQuote","b"]]],["$Disj",["$Xcep",["$Regex","[0-9]+"],["$NT","S"]]]]]],41,[]])
    })
    it('tests EBNF negative (missing ";")', () => {
      assert.deepEqual(EBNF('S ; "ab" A | S "c"; A = "b" | /[0-9]+/ S', 0), [[EBNF.type], 0, []])
    })
    it('tests EBNF negative (wrong rule "=")', () => {
      const original = `S =
    "ab" A
    | S "c";
  A == "b"
    | /[0-9]+/ S;`
      assert.deepEqual(EBNF(original, 0), [["$EBNF",["$Rule","S",["$Exp",["$Disj",["$Xcep",["$DblQuote","ab"],["$NT","A"]]],["$Disj",["$Xcep",["$NT","S"],["$DblQuote","c"]]]]]],30,[]])
    })
  })
})