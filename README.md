# pasre
A ~7kB Parsing utility

## Install

```npm install pasre```

```yarn add pasre```

## Parse a string

### Import the parser

```javascript
const { pasre } = require('pasre')
```

```javascript
import { pasre } from 'pasre'
```

### Use the parser

```javascript
const grammar = `
  S = 's' A | '0';
  A = 'a' S;
`
const parser = pasre(grammar)

```

`parser` is a hash. Each rule head of the grammar is a key in the hash. In this case,

```javascript
typeof parser.S === 'function'
typeof parser.A === 'function'
```

If the string `head` is the head of a rule, and `input` is some string, then

```javascript
parser[head](input)
```

parses the `input` using the given grammar, using the `head` as an axiom. The output of `parser[head](input)` is a parsed tree.

### The grammar

The `parser` function from `pasre` takes a string that represents an EBNF grammar.

## Traverse a parsed tree

### Import the traverser

```javascript
const { getTraverser } = require('pasre')
```

```javascript
import { getTraverser } from 'pasre'
```

### Use the traverser

The `getTraverser` function takes a hash that defines how to aggregate the children of a given node. A node in the tree is the result of parsing a rule; its root is the `head` of the rule, and its children is the parsed body.

For example, if `S = 's' A | '0'; A = 'a' S` is a grammar, and `tree` has been defined as

```javascript
const tree = pasre(grammar).S('sasasa0')
```

then

```javascript
const traverser = getTraverser({
  S: ([s, A]) => s === '0' ? 0 : 1 + A,
  A: ([a, S]) => 2 * S
})
```

returns a function that takes a parsed tree and traverses it, aggregating the values of all the nodes.

```javascript
traverser(tree) === 7
```

### Traversing hash functions

`getTraverser` takes a hash `{head: aggregator}`, where `head` is a rule head, and `aggregator` is a function that determines how to aggregate the body of a node with that head.

The aggregator function takes one parameter that is an array. Each item of the array is the value given to the corresponding child of the node. In particular, the item is the result of aggregating the child node.

#### Example

```javascript
const tree = pasre(grammar).S('sasasa0')
const traverser = getTraverser({
  S: ([s, A]) => {
  	console.log('S', s, A)
  	return s === '0' ? 0 : 1 + A
  },
  A: ([a, S]) => {
  	console.log('A', a, S)
  	return 2 * S
  }
})(tree)
```

Produces this output

```
S 0 undefined
A a 0
S s 0
A a 1
S s 2
A a 3
S s 6
```

### Undefined aggregators

If the `{head: aggregator}` hash does not include the `head` of certain rule `R`, then the array parameter of each aggregator function does not include the item corresponding to rule `R`.

#### Example

We include an extra *whitespace* rule. Since we do not define an aggregator for it, the other rules do not need to include the value it would yield.

```javascript
const grammar = `
  S = 's' W A | '0' W;
  A = 'a' W S;
  W = /[ \t\n]/;
`
const tree = pasre(grammar).S('sa  s asa 0')
const value = getTraverser({
  S: ([s, A]) => s === '0' ? 0 : 1 + A,
  A: ([a, S]) => 2 * S
})(tree)
```

Then `value = 7`. The functions for `S` and `A` don't need to worry for the presence of `W` in the body of their rules.
