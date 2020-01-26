const MATCH = module.exports.MATCH = regex => (input, ...configs) => {
  const match = input.match(regex)
  if (!match || match.index !== 0) {
    return [['MATCH', null], input]
  } else {
    return [['MATCH', match[0]], input.slice(match[0].length)]
  }
}

const LITERAL = module.exports.LITERAL = literal => (input, ...configs) => {
  if (input.indexOf(literal) === 0) {
    return [['LITERAL', literal], input.slice(literal.length)]
  }
  return [['LITERAL', null], input]
}

const CONCAT = module.exports.CONCAT = (...rules) => (input, ...configs) => {
  let node, rest, root, result = []
  const originalInput = input
  for (let i = 0; i < rules.length; i++) {
    [[root, node], rest] = rules[i](input, ...configs)
    if (node === null) {
      return [['CONCAT', null], originalInput]
    } else {
      input = rest
      result.push([root, node])
    }
  }
  return [['CONCAT', result], input]
}

const DISJUNCTION = module.exports.DISJUNCTION = (...rules) => (input, ...configs) => {
  let node, rest, root
  for (let i = 0; i < rules.length; i++) {
    [[root, node], rest] = rules[i](input, ...configs)
    if (node) {
      return [['DISJUNCTION', [root, node]], rest]
    }
  }
  return [['DISJUNCTION', null], input]
}

const OPTION = module.exports.OPTION = rule => (input, ...configs) => {
  const [[root, node], rest] = rule(input, ...configs)
  return node
	  ? [['OPTION', [root, node]], rest]
	  : [['OPTION', ''], input]
}

const CLOSURE = module.exports.CLOSURE = rule => (input, ...configs) => {
  let [[root, node], rest] = rule(input, ...configs)
  let result = [], partial
  while (node) {
    result.push([root, node])
    partial = rule(rest, ...configs)
    root = partial[0][0]
    node = partial[0][1]
    rest = partial[1]
  }
  return [['CLOSURE', result], rest]
}

const REPETITION = module.exports.REPETITION = (times, rule) => (input, ...configs) => {
  let root, node, rest, result = []
  for (let i = 0; i < times; i++) {
    [[root, node], rest] = rule(input, ...configs)
    if (!node) {
      return [['REPETITION', null], input]
    }
    input = rest
    result.push([root, node])
  }
  return [['REPETITION', result], input]
}

const EXCEPTION = module.exports.EXCEPTION = (rule, exceptRule) => (input, ...configs) => {
  const [[root, node], rest] = rule(input, ...configs)
  const [[_, exceptNode]] = exceptRule(input, ...configs)
  if (!node || exceptNode) {
    return [['EXCEPTION', null], input]
  }
  return [['EXCEPTION', node], rest]
}

const EXPECT = module.exports.EXPECT = (rule, expected, recoveryRule = (x) => [['EXPECT', null], x]) => (input, { original = input, errors = [], ...configs}) => {
  const result = rule(input, { original, errors, ...configs })
  if (result[0][1] === null) {
    const got = input === ''
      ? 'end of input'
      : `'${input.slice(0, 20).split("\n").join("\\n")}...'`
    const lines = input === ''
      ? original.split('\n')
      : original.slice(0, original.indexOf(input)).split('\n')
    const line = lines.length
    const col = lines[line - 1].length
    errors.push(`✘ ${line}:${col} | Expected '${expected}', got ${got}`)
    return recoveryRule(input)
  }
  return result
}