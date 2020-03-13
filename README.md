# @carlosvpi/parser
A ~6kB Parsing utility

## Install

```npm install @carlosvpi/parser```

```yarn add @carlosvpi/parser```

## Parse a string

### Import the parser

```javascript
const getParser = require('@carlosvpi/parser')
```

```javascript
import getParser from '@carlosvpi/parser'
```

### Use the parser

```javascript
const grammar = `
  S = 's' A | '0';
  A = 'a' S;
`
const parser = getParser(grammar)

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

The grammar that the `getParser` function (from `@carlosvpi/parser`) takes is a string that follows the same syntax described in the [Wikipedia page for EBNF](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form).

### The tree

The result of `parser[head](input)` is a tree where nodes have this shape:

`[root, ...children]`

The `root` is a string with these possible values:

* '$LITERAL': has only one child, the parsed literal,
* '$MATCH': its children are the result of applying a regex to the input using js regex match,
* '$CONCAT': its children are other nodes,
* `head`: this node corresponds to the parsing the input using a rule `head`

### Example

This code

```javascript
parser(`
  S = 's' A | '0';
  A = 'a' S;
`).S('sasa0')
```

produces this tree:

```json
[
   "S",
   [
      "$CONCAT",
      [
         "$LITERAL",
         "s"
      ],
      [
         "A",
         [
            "$CONCAT",
            [
               "$LITERAL",
               "a"
            ],
            [
               "S",
               [
                  "$CONCAT",
                  [
                     "$LITERAL",
                     "s"
                  ],
                  [
                     "A",
                     [
                        "$CONCAT",
                        [
                           "$LITERAL",
                           "a"
                        ],
                        [
                           "S",
                           [
                              "$CONCAT",
                              [
                                 "$LITERAL",
                                 "0"
                              ]
                           ]
                        ]
                     ]
                  ]
               ]
            ]
         ]
      ]
   ]
]
```