# pasre
Parsing utility

## Install

```npm install pasre```

```yarn add pasre```

## Import

```javascript
const pasre = require('pasre')
```

```javascript
import pasre from 'pasre'
```

## Parse a grammar

```javascript
const parser = pasre(`S = 's' A | '0'; A = 'a' S`)
const tree = parser('sasasa0')
```

## Traverse a syntactic tree

```javascript
const result = traverse({
  S: (value1, value2) => (console.log('S', value1, value2), value2 ? 1 + 2 * value2 : 0),
  A: (value1, value2) => (console.log('A', value1, value2), 1 + value2)
})(tree)
console.log('result', result)
```

```
S '0' undefined
A 'a' 0
S 's' 1
A 'a' 3
S 's' 4
A 'a' 9
S 's' 10
result 21
```
