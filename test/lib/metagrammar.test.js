const assert = require('assert')
const { meta } = require('../../lib/metagrammar')

describe('metagrammar', () => {
	it('Parses itself', () => {
		console.log(meta())
	})
})