const assert = require('assert')
const { LITERAL } = require('../../lib/hoc')
const {
	WS,
	WSs,
	NT,
	Conc,
	Xcep,
	Disj,
	Rule
} = require('../../lib/rules')

describe('rules', () => {
	it('tests WS positive', () => {
		const errors = []
		assert.deepEqual(WS(' is a text', { errors }), [' ', 'is a text'])
		assert.deepEqual(errors, [])
	})
	it('tests WS negative', () => {
		const errors = []
		assert.deepEqual(WS('this is a text', { errors }), [null, 'this is a text'])
		assert.deepEqual(errors, [])
	})
	it('tests WSs positive', () => {
		const errors = []
		assert.deepEqual(WSs('    is a text', { errors }), [[' ',' ',' ',' '], 'is a text'])
		assert.deepEqual(errors, [])
	})
	it('tests WSs negative', () => {
		const errors = []
		assert.deepEqual(WSs('this is a text', { errors }), [[], 'this is a text'])
		assert.deepEqual(errors, [])
	})
	it('tests NT positive', () => {
		const errors = []
		assert.deepEqual(NT('this is a text', { errors }), [['this', [' ']], 'is a text'])
		assert.deepEqual(errors, [])
	})
	it('tests NT negative', () => {
		const errors = []
		assert.deepEqual(NT('$this is a text', { errors }), [null, '$this is a text'])
		assert.deepEqual(errors, [])
	})
	it('tests Conc positive (repetition)', () => {
		const errors = []
		assert.deepEqual(Conc('12  *s$', { errors }), [['12', [' ', ' '], '*', [], ['s', []]], '$'])
		assert.deepEqual(errors, [])
	})
	it('tests Conc negative (repetition)', () => {
		const errors = []
		assert.deepEqual(Conc('12  s*2$', { errors }), [null, '12  s*2$'])
		assert.deepEqual(errors, ["✘ 1:0 | Expected '*', got 's*2$...'"])
	})
	it('tests Conc positive (NT)', () => {
		const errors = []
		assert.deepEqual(Conc('potato  *s$', { errors }), [['potato', [' ', ' ']], '*s$'])
		assert.deepEqual(errors, [])
	})
	it('tests Conc positive (double quotes)', () => {
		const errors = []
		assert.deepEqual(Conc('"quotations" $', { errors }), [['"','quotations','"', [' ']], '$'])
		assert.deepEqual(errors, [])
	})
	it('tests Conc negative (double quotes)', () => {
		const errors = []
		assert.deepEqual(Conc('"quotations $', { original: '"quotations $', errors }), [null, '"quotations $'])
		assert.deepEqual(errors, ["✘ 1:13 | Expected '\"', got end of input"])
	})
	it('tests Conc positive (single quotes)', () => {
		const errors = []
		assert.deepEqual(Conc("'quotations' $", { errors }), [["'",'quotations',"'", [' ']], '$'])
		assert.deepEqual(errors, [])
	})
	it('tests Conc negative (single quotes)', () => {
		const errors = []
		assert.deepEqual(Conc("'quotations $", { original: "'quotations $", errors }), [null, "'quotations $"])
		assert.deepEqual(errors, ["✘ 1:13 | Expected ''', got end of input"])
	})
	it('tests Conc positive (regex)', () => {
		const errors = []
		assert.deepEqual(Conc('/[]/ $', { errors }), [["/",'[]',"/", [' ']], '$'])
		assert.deepEqual(errors, [])
	})
	it('tests Conc negative (regex)', () => {
		const errors = []
		assert.deepEqual(Conc('/[] $', { original: "/[] $", errors }), [null, '/[] $'])
		assert.deepEqual(errors, ["✘ 1:5 | Expected '/', got end of input"])
	})
	it('tests Conc positive ([])', () => {
		const errors = []
		assert.deepEqual(Conc('[ potato]$', { errors }), [['[', [' '], [[[['potato', []], []], ''], []], ']', []], '$'])
		assert.deepEqual(errors, [])
	})
	it('tests Conc negative ([])', () => {
		const errors = []
		assert.deepEqual(Conc('[ potato$', { errors }), [null, '[ potato$'])
		assert.deepEqual(errors, ["✘ 1:0 | Expected ']', got '$...'"])
	})
	it('tests Conc positive ({})', () => {
		const errors = []
		assert.deepEqual(Conc('{ potato}$', { errors }), [['{', [' '], [[[['potato', []], []], ''], []], '}', []], '$'])
		assert.deepEqual(errors, [])
	})
	it('tests Conc negative ({})', () => {
		const errors = []
		assert.deepEqual(Conc('{ potato$', { errors }), [null, '{ potato$'])
		assert.deepEqual(errors, ["✘ 1:0 | Expected '}', got '$...'"])
	})
	it('tests Conc positive (??)', () => {
		const errors = []
		assert.deepEqual(Conc('? potato?$', { errors, special: LITERAL(' potato') }), [['?', ' potato', '?', []], '$'])
		assert.deepEqual(errors, [])
	})
	it('tests Conc negative (?? - fail inner rule)', () => {
		const errors = []
		assert.deepEqual(Conc('? potato?$', { errors, special: LITERAL(' protato') }), [null, '? potato?$'])
		assert.deepEqual(errors, ["✘ 1:0 | Expected 'special rule', got ' potato?$...'"])
	})
	it('tests Conc negative (?? - fail presence of ?)', () => {
		const errors = []
		assert.deepEqual(Conc('? potato$', { errors, special: LITERAL(' potato') }), [null, '? potato$'])
		assert.deepEqual(errors, ["✘ 1:0 | Expected '?', got '$...'"])
	})
	it('tests Conc negative', () => {
		const errors = []
		assert.deepEqual(Conc('12  *$', { errors }), [null, '12  *$'])
		assert.deepEqual(errors, [])
	})
	it('tests Xcep positive', () => {
		const errors = []
		assert.deepEqual(Xcep('ab c$', { errors }), [[['ab', [' ']], [['c', []]]], '$'])
		assert.deepEqual(errors, [])
	})
	it('tests Xcep negative', () => {
		const errors = []
		assert.deepEqual(Xcep('12ab c$', { errors }), [null, '12ab c$'])
		assert.deepEqual(errors, ["✘ 1:0 | Expected '*', got 'ab c$...'"])
	})
	it('tests Disj positive (no except)', () => {
		const errors = []
		assert.deepEqual(Disj('ab c$', { errors }), [[[['ab', [' ']], [['c', []]]], ''], '$'])
		assert.deepEqual(errors, [])
	})
	it('tests Disj positive (with except)', () => {
		const errors = []
		assert.deepEqual(Disj('ab c - potato$', { errors }), [[[['ab', [' ']], [['c', [' ']]]], ['-', [' '], [[[['potato', []], []], ''], []]]], '$'])
		assert.deepEqual(errors, [])
	})
	it('tests Disj negative', () => {
		const errors = []
		assert.deepEqual(Disj('12ab c$', { errors }), [null, '12ab c$'])
		assert.deepEqual(errors, ["✘ 1:0 | Expected '*', got 'ab c$...'"])
	})
	it('tests Rule positive', () => {
		const original = 'S = ab | c;'
		const errors = []
		assert.deepEqual(Rule(original, { original, errors }), [[['S',[' ']],'=',[' '],[[[['ab',[' ']],[]],''],[['|',[' '],[[[['c',[]],[]], ''], []]]]], ';', []], ''])
		assert.deepEqual(errors, [])
	})
	it('tests Rule negative (missing ";")', () => {
		const original = 'S = ab | c'
		const errors = []
		assert.deepEqual(Rule(original, { original, errors }), [null, 'S = ab | c'])
		assert.deepEqual(errors, ["✘ 1:10 | Expected ';', got end of input"])
	})
})