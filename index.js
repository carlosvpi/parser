// WS     = /[\ \n\t]/
//        | '(*' NoCloseComment '*)'
// WSs    = { WS }
// NT     = /[a-zA-Z_][a-zA-Z0-9_]*/
// Rule   = NT '=' WSs Exp ';' WSs
// Exp    = Disj { '|' WSs Disj }
// Disj   = Xcep ['-' WSs Xcep]
// Xcep   = Conc { Conc }
// Conc   = /[0-9]+/ WSs '*' WSs NT
//        | NT
//        | '"' NoDblQuote '"' WSs
//        | "'" NoSglQuote "'" WSs
//        | '/' NoSlash '/' WSs
//        | '[' Exp ']' WSs
//        | '{' Exp '}' WSs
//        | '(' Exp ')' WSs
//        | '?' NoQuestion '?' WSs

export const MATCH = regex => (input) {
  const match = input.match(regex)
  if (!match || match.index !== 0) {
    return [null, input]
  } else {
    return [match, input.slice(match[0].length)]
  }
}

export const LITERAL = literal => (input) => {
  if (input.indexOf(literal) === 0) {
    return [literal, input.slice(literal.length)]
  }
  return [null, input]
}

export const CONCAT = (...rules) => (input) => {
  let node, rest, result = []
  const originalInput = input
  for (let i = 0; i < rules.length; i++) {
    [node, rest] = rules[i](input)
    if (!node) {
      return [null, originalInput]
    } else {
      input = rest
      result.push(node)
    }
  }
  return [result, input]
}

export const DISJUNCTION = (...rules) => (input) => {
  let node, rest
  for (let i = 0; i < rules.length; i++) {
    [node, rest] = rules[i](input)
    if (node) {
      return [node, rest]
    }
  }
  return [null, input]
}

export const OPTION = rule => (input) => {
  const [node, rest] = rule(input)
  return node
	  ? [node, rest]
	  : [result, input]
}

export const CLOSURE = rule => (input) => {
  let [node, rest] = rule(input)
  let result = []
  while (node) {
    input = rest
    result.push(node)
    [node, rest] = rule(input)
  }
  return [result, input]
}

export const REPETITION = (times, rule) => (input) => {
  let node, rest, result
  for (let i = 0; i < times; i++) {
    [node, rest] = rule(input)
    if (!node) {
      return [null, input]
    }
    input = rest
    result.push(node)
  }
  return [result, input]
}

export const EXCEPTION = (rule, exceptRule) => (input) => {
  const [node, rest] = rule(input)
  const [exceptNode] = exceptRule(input)
  if (!node || exceptNode) {
    return [null, input]
  }
  return [node, rest]
}