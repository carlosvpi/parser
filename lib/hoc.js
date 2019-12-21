module.exports.MATCH = regex => (input) => {
  const match = input.match(regex)
  if (!match || match.index !== 0) {
    return [null, input]
  } else {
    return [match[0], input.slice(match[0].length)]
  }
}

module.exports.LITERAL = literal => (input) => {
  if (input.indexOf(literal) === 0) {
    return [literal, input.slice(literal.length)]
  }
  return [null, input]
}

module.exports.CONCAT = (...rules) => (input) => {
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

module.exports.DISJUNCTION = (...rules) => (input) => {
  let node, rest
  for (let i = 0; i < rules.length; i++) {
    [node, rest] = rules[i](input)
    if (node) {
      return [node, rest]
    }
  }
  return [null, input]
}

module.exports.OPTION = rule => (input) => {
  const [node, rest] = rule(input)
  return node
	  ? [node, rest]
	  : ['', input]
}

module.exports.CLOSURE = rule => (input) => {
  let [node, rest] = rule(input)
  let result = [], partial
  while (node) {
    result.push(node)
    partial = rule(rest)
    node = partial[0]
    rest = partial[1]
  }
  return [result, rest]
}

module.exports.REPETITION = (times, rule) => (input) => {
  let node, rest, result = []
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

module.exports.EXCEPTION = (rule, exceptRule) => (input) => {
  const [node, rest] = rule(input)
  const [exceptNode] = exceptRule(input)
  if (!node || exceptNode) {
    return [null, input]
  }
  return [node, rest]
}

module.exports.EXPECT = (rule, expected, original, recoveryRule = (x) => [null, x], errors = []) => (input) => {
  const result = rule(input)
  if (result[0] === null) {
    const got = input === ''
      ? 'end of input'
      : `'${input.slice(0, 20).split("\n").join("\\n")}...'`
    const lines = original.slice(0, original.indexOf(input)).split('\n')
    const line = lines.length
    const col = lines[line - 1].indexOf(input)
    errors.push(`✘ ${line}:${col} | Expected '${expected}', got ${got}`)
    return recoveryRule(input)
  }
  return result
}