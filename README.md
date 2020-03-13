# pasre
A ~7kB Parsing utility

## Install

```npm install pasre```

```yarn add pasre```

## Parse a string

### Import the parser

```javascript
const pasre = require('pasre')
```

```javascript
import pasre from 'pasre'
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
`).S('sasasa0')
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
         ]
      ]
   ]
]
```