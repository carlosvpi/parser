const assert = require('assert')
const {
	WS,
	WSs,
	NT,
	Conc
} = require('../../lib/rules')

describe('rules', () => {
	it('tests WS positive', () => {
		assert.deepEqual(WS(' is a text'), [' ', 'is a text'])
	})
	it('tests WS negative', () => {
		assert.deepEqual(WS('this is a text'), [null, 'this is a text'])
	})
	it('tests WSs positive', () => {
		assert.deepEqual(WSs('    is a text'), [[' ',' ',' ',' '], 'is a text'])
	})
	it('tests WSs negative', () => {
		assert.deepEqual(WSs('this is a text'), [[], 'this is a text'])
	})
	it('tests NT positive', () => {
		assert.deepEqual(NT('this is a text'), [['this', [' ']], 'is a text'])
	})
	it('tests NT negative', () => {
		assert.deepEqual(NT('$this is a text'), [null, '$this is a text'])
	})
	it('tests Conc positive (repetition)', () => {
		assert.deepEqual(Conc('12  *s$'), [['12', [' ', ' '], '*', [], ['s', []]], '$'])
	})
	it('tests Conc positive (NT)', () => {
		assert.deepEqual(Conc('potato  *s$'), [['potato', [' ', ' ']], '*s$'])
	})
	it('tests Conc positive (double quotes)', () => {
		assert.deepEqual(Conc('"quotations" $'), [['"','quotations','"', [' ']], '$'])
	})
	it('tests Conc negative (double quotes)', () => {
		const errors = []
		assert.deepEqual(Conc('"quotations $', { original: '"quotations $', errors }), [null, '"quotations $'])
		assert.deepEqual(errors, ["✘ 1:13 | Expected '\"', got end of input"])
	})
	it('tests Conc positive (single quotes)', () => {
		assert.deepEqual(Conc("'quotations' $"), [["'",'quotations',"'", [' ']], '$'])
	})
	it('tests Conc negative (single quotes)', () => {
		const errors = []
		assert.deepEqual(Conc("'quotations $", { original: "'quotations $", errors }), [null, "'quotations $"])
		assert.deepEqual(errors, ["✘ 1:13 | Expected ''', got end of input"])
	})
	it('tests Conc positive (regex)', () => {
		assert.deepEqual(Conc('/[]/ $'), [["/",'[]',"/", [' ']], '$'])
	})
	it('tests Conc negative (regex)', () => {
		const errors = []
		assert.deepEqual(Conc('/[] $', { original: "/[] $", errors }), [null, '/[] $'])
		assert.deepEqual(errors, ["✘ 1:5 | Expected '/', got end of input"])
	})
	it('tests Conc positive ([])', () => {
	})
	it('tests Conc negative ([])', () => {
	})
	it('tests Conc positive ({})', () => {
	})
	it('tests Conc negative ({})', () => {
	})
	it('tests Conc positive (())', () => {
	})
	it('tests Conc negative (())', () => {
	})
	it('tests Conc positive (??)', () => {
	})
	it('tests Conc negative (??)', () => {
	})
	it('tests Conc negative', () => {
		assert.deepEqual(Conc('12  *$'), [null, '12  *$'])
	})
})