const assert = require('assert')
const {
	WS,
	WSs,
	NT,
	Conc,
	Xcep,
	Disj,
	Exp,
	Rule
} = require('../../lib/rules')
const { LITERAL } = require('../../lib/hoc')

describe('rules', () => {
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
		assert.deepEqual(WS('this is a text', { errors }), [['WS', null], 'this is a text'])
		assert.deepEqual(errors, [])
	})
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
	it('tests NT positive', () => {
		const errors = []
		assert.deepEqual(NT('this is a text', { errors }), [['NT', 'this'], 'is a text'])
		assert.deepEqual(errors, [])
	})
	it('tests NT negative', () => {
		const errors = []
		assert.deepEqual(NT('$this is a text', { errors }), [['NT', null], '$this is a text'])
		assert.deepEqual(errors, [])
	})
	it('tests Conc positive (repetition)', () => {
		const errors = []
		const expected = [['Multiplication',['12','s']],'$']
		assert.deepEqual(Conc('12  *s$', { errors }), expected)
		assert.deepEqual(errors, [])
	})
	it('tests Conc negative (repetition)', () => {
		const errors = []
		assert.deepEqual(Conc('12  s*2$', { errors }), [['Expression', null], '12  s*2$'])
		assert.deepEqual(errors, ["✘ 1:0 | Expected '*', got 's*2$...'"])
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
		assert.deepEqual(Conc('"quotations $', { original: '"quotations $', errors }), [['Expression', null], '"quotations $'])
		assert.deepEqual(errors, ["✘ 1:13 | Expected '\"', got end of input"])
	})
	it('tests Conc positive (single quotes)', () => {
		const errors = []
		assert.deepEqual(Conc("'quotations' $", { errors }), [['SglQuote', 'quotations'], '$'])
		assert.deepEqual(errors, [])
	})
	it('tests Conc negative (single quotes)', () => {
		const errors = []
		assert.deepEqual(Conc("'quotations $", { original: "'quotations $", errors }), [['Expression', null], "'quotations $"])
		assert.deepEqual(errors, ["✘ 1:13 | Expected ''', got end of input"])
	})
	it('tests Conc positive (regex)', () => {
		const errors = []
		assert.deepEqual(Conc('/[]/ $', { errors }), [['Regex', '[]'], '$'])
		assert.deepEqual(errors, [])
	})
	it('tests Conc negative (regex)', () => {
		const errors = []
		assert.deepEqual(Conc('/[] $', { original: "/[] $", errors }), [['Expression', null], '/[] $'])
		assert.deepEqual(errors, ["✘ 1:5 | Expected '/', got end of input"])
	})
	it('tests Conc positive ([])', () => {
		const errors = []
		assert.deepEqual(Conc('[ potato]$', { errors }), [['Option', ['Disjunction', [['Exception', ['Concatenation', [['NT', 'potato']]]]]]], '$'])
		assert.deepEqual(errors, [])
	})
	it('tests Conc positive ([]) long', () => {
		const errors = []
		assert.deepEqual(Conc('[ potato | banana]$', { errors }), [['Option',['Disjunction',[['Exception',['Concatenation',[['NT','potato']]]],['Exception',['Concatenation',[['NT','banana']]]]]]],'$'])
		assert.deepEqual(errors, [])
	})
	it('tests Conc negative ([])', () => {
		const errors = []
		assert.deepEqual(Conc('[ potato$', { errors }), [['Expression', null], '[ potato$'])
		assert.deepEqual(errors, ["✘ 1:0 | Expected ']', got '$...'"])
	})
	it('tests Conc positive ({})', () => {
		const errors = []
		assert.deepEqual(Conc('{ potato}$', { errors }), [['Repetition', ["Disjunction",[["Exception",["Concatenation",[["NT","potato"]]]]]]], '$'])
		assert.deepEqual(errors, [])
	})
	it('tests Conc negative ({})', () => {
		const errors = []
		assert.deepEqual(Conc('{ potato$', { errors }), [['Expression', null], '{ potato$'])
		assert.deepEqual(errors, ["✘ 1:0 | Expected '}', got '$...'"])
	})
	// // it('tests Conc positive (??)', () => {
	// // 	const errors = []
	// // 	assert.deepEqual(Conc('? potato?$', { errors, special: LITERAL(' potato') }), [['?', ' potato', '?', []], '$'])
	// // 	assert.deepEqual(errors, [])
	// // })
	// it('tests Conc negative (?? - fail inner rule)', () => {
	// 	const errors = []
	// 	assert.deepEqual(Conc('? potato?$', { errors, special: LITERAL(' protato') }), [['Conc', null], '? potato?$'])
	// 	assert.deepEqual(errors, ["✘ 1:0 | Expected 'special rule', got ' potato?$...'"])
	// })
	// // it('tests Conc negative (?? - fail presence of ?)', () => {
	// // 	const errors = []
	// // 	assert.deepEqual(Conc('? potato$', { errors, special: LITERAL(' potato') }), [null, '? potato$'])
	// // 	assert.deepEqual(errors, ["✘ 1:0 | Expected '?', got '$...'"])
	// // })
	it('tests Conc negative', () => {
		const errors = []
		assert.deepEqual(Conc('12  *$', { errors }), [['Expression', null], '12  *$'])
		assert.deepEqual(errors, [])
	})
	it('tests Xcep positive', () => {
		const errors = []
		assert.deepEqual(Xcep('ab c d$', { errors }), [['Concatenation', [['NT', 'ab'], ['NT', 'c'], ['NT', 'd']]], '$'])
		assert.deepEqual(errors, [])
	})
	it('tests Xcep negative', () => {
		const errors = []
		assert.deepEqual(Xcep('12ab c d$', { errors }), [['Concatenation', null], '12ab c d$'])
		assert.deepEqual(errors, ["✘ 1:0 | Expected '*', got 'ab c d$...'"])
	})
	it('tests Disj positive (no except)', () => {
		const errors = []
		assert.deepEqual(Disj('ab c d$', { errors }), [['Exception', ['Concatenation', [['NT', 'ab'], ['NT', 'c'], ['NT', 'd']]], null], '$'])
		assert.deepEqual(errors, [])
	})
	it('tests Disj positive (with except)', () => {
		const errors = []
		assert.deepEqual(Disj('ab c - potato$', { errors }), [['Exception', ['Concatenation', [['NT', 'ab'], ['NT', 'c']]], ['Concatenation', [['NT', 'potato']]]], '$'])
		assert.deepEqual(errors, [])
	})
	it('tests Disj negative', () => {
		const errors = []
		assert.deepEqual(Disj('12ab c$', { errors }), [['Exception', null, null], '12ab c$'])
		assert.deepEqual(errors, ["✘ 1:0 | Expected '*', got 'ab c$...'"])
	})
	it('tests Exp positive (simple)', () => {
		const errors = []
		assert.deepEqual(Exp('ab c$', { errors }), [['Disjunction', [['Exception', ['Concatenation', [['NT', 'ab'], ['NT', 'c']]]]]], '$'])
		assert.deepEqual(errors, [])
	})
	it('tests Exp positive (many)', () => {
		const errors = []
		assert.deepEqual(Exp('ab c | potato | banana$', { errors }), [['Disjunction', [['Exception', ['Concatenation', [['NT', 'ab'], ['NT', 'c']]]], ['Exception', ['Concatenation', [['NT', 'potato']]]], ['Exception', ['Concatenation', [['NT', 'banana']]]]]], '$'])
		assert.deepEqual(errors, [])
	})
	it('tests Exp negative', () => {
		const errors = []
		assert.deepEqual(Exp('12ab c$', { errors }), [['Disjunction', null], '12ab c$'])
		assert.deepEqual(errors, ["✘ 1:0 | Expected '*', got 'ab c$...'"])
	})
	it('tests Rule positive', () => {
		const original = 'S = ab | c;'
		const errors = []
		assert.deepEqual(Rule(original, { original, errors }), [['Rule',['NT','S'],['Disjunction',[['Exception',['Concatenation',[['NT','ab']]]],['Exception',['Concatenation',[['NT','c']]]]]]],''])
		assert.deepEqual(errors, [])
	})
	it('tests Rule negative (missing ";")', () => {
		const original = 'S = ab | c'
		const errors = []
		assert.deepEqual(Rule(original, { original, errors }), [['Rule', null, null], 'S = ab | c'])
		assert.deepEqual(errors, ["✘ 1:10 | Expected ';', got end of input"])
	})
})