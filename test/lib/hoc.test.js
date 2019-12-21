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

	it('tests LITERAL', () => {
		assert.deepEqual(LITERAL('this')(input), ['this', ' is a text'])
		assert.deepEqual(LITERAL('that')(input), [null, 'this is a text'])
	})

	it('tests MATCH', () => {
		assert.deepEqual(MATCH(/\w+/)(input), ['this', ' is a text'])
		assert.deepEqual(MATCH(/[q]h?i\w/)(input), [null, 'this is a text'])
	})

	it('tests CONCAT', () => {
		assert.deepEqual(CONCAT(
			LITERAL('this'),
			MATCH(/[ \t\n]/),
			LITERAL('is'),
		)(input), [['this', ' ', 'is'], ' a text'])
		assert.deepEqual(CONCAT(
			LITERAL('this'),
			MATCH(/[ \t\n]/),
			LITERAL('was'),
		)(input), [null, 'this is a text'])
	})

	it('tests DISJUNCTION', () => {
		assert.deepEqual(DISJUNCTION(
			LITERAL('this'),
			LITERAL('that'),
		)(input), ['this', ' is a text'])
		assert.deepEqual(DISJUNCTION(
			LITERAL('these'),
			LITERAL('that'),
		)(input), [null, 'this is a text'])
	})

	it('tests OPTION', () => {
		assert.deepEqual(OPTION(
			LITERAL('this')
		)(input), ['this', ' is a text'])
		assert.deepEqual(OPTION(
			LITERAL('that')
		)(input), ['', 'this is a text'])
	})

	it('tests CLOSURE', () => {
		assert.deepEqual(CLOSURE(
			MATCH(/\w/)
		)(input), [['t','h','i','s'], ' is a text'])
		assert.deepEqual(CLOSURE(
			MATCH('\W')
		)(input), [[], 'this is a text'])
	})

	it('tests REPETITION', () => {
		assert.deepEqual(REPETITION(
			4, MATCH(/\w/)
		)(input), [['t','h','i','s'], ' is a text'])
		assert.deepEqual(REPETITION(
			5, MATCH('\W')
		)(input), [null, 'this is a text'])
	})

	it('tests EXCEPTION', () => {
		assert.deepEqual(EXCEPTION(
			MATCH(/\w+/), LITERAL('that')
		)(input), ['this', ' is a text'])
		assert.deepEqual(EXCEPTION(
			MATCH(/\w+/), LITERAL('this')
		)(input), [null, 'this is a text'])
	})

	it('tests EXPECT', () => {
		const errors = []
		assert.deepEqual(EXPECT(
			LITERAL('this'),
			'this'
		)(input, { original: input, errors }), ['this', ' is a text'])
		assert.deepEqual(errors, [])
		assert.deepEqual(EXPECT(
			LITERAL('that'),
			'that',
		)(input, { original: input, errors }), [null, 'this is a text'])
		assert.deepEqual(errors, ["✘ 1:0 | Expected 'that', got 'this is a text...'"])
		assert.deepEqual(EXPECT(
			LITERAL('that'),
			'that',
		)(input, { original: 'original text\nwith some lines\nand then this is a text', errors }), [null, 'this is a text'])
		assert.deepEqual(errors, ["✘ 1:0 | Expected 'that', got 'this is a text...'", "✘ 3:9 | Expected 'that', got 'this is a text...'"])
	})
})
