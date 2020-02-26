const assert = require('assert')
const { getTraverser } = require('../../lib/traverse')

t = (r,...c) => [r,c]
const v = getTraverser.valueType

describe('traverse', () => {
	it('Traverses the tree with bubbling', () => {
		const tree = t('+', t('*', t(v, 3), t('-', t(v,4), t(v,1))), t('/', t('+', t(v,5), t(v,3)), t(v,2)), t('-', t(v,11), t('*', t(v,1), t(v,2))))
		const traverser = getTraverser({
			'+': (...values) => values.reduce((acc, value) => acc + value, 0),
			'-': (minuend, subtrahend) => minuend - subtrahend,
			'*': (...values) => values.reduce((acc, value) => acc * value, 1),
			'/': (dividend, divisor) => dividend / divisor,
		})
		assert.deepEqual(traverser(tree), 22)
	})
	it('Traverses the tree with bubbling and capturing', () => {
		const tree = t('+', t('*', t(v, 3), t('-', t(v,4), t(v,1))), t('/', t('+', t(v,5), t(v,3)), t(v,2)), t('-', t(v,11), t('*', t(v,1), t(v,2))))
		const traverser = getTraverser({
			'+': (...values) => values.reduce((acc, value) => acc + value, 0),
			'-': (minuend, subtrahend) => minuend - subtrahend,
			'*': (...values) => values.reduce((acc, value) => acc * value, 1),
			'/': (dividend, divisor) => dividend / divisor,
		}, {
			'/': (dividend, divisor) => [[dividend[0], [...dividend[1], t(v, 2)]], divisor]
		})
		assert.deepEqual(traverser(tree), 23)
	})
})
