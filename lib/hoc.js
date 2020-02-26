const MATCH = module.exports.MATCH = regex => function* MATCH (input) {
  const match = input.match(regex)
  if (!match || match.index !== 0) {
    yield [['MATCH', null], input]
  } else {
    yield [['MATCH', match[0]], input.slice(match[0].length)]
  }
}

const LITERAL = module.exports.LITERAL = literal => function* LITERAL (input) {
  if (input.indexOf(literal) === 0) {
    yield [['LITERAL', literal], input.slice(literal.length)]
  } else {
    yield [['LITERAL', null], input]
  }
}

const CONCAT = module.exports.CONCAT = (...rules) => function* CONCAT (input) {
  let value, rest, type, result = [], stack = [[0, input, []]]
  let ruleIndex, ruleInput, yielded, concatValue, substack, flag = false

  while (stack.length) {
    [[ruleIndex, ruleInput, concatValue], ...stack] = stack
    substack = []
    if (ruleIndex === rules.length) {
      flag = true
      yield [['CONCAT', concatValue], ruleInput]
    } else {
      for ([[type, value], rest] of rule[ruleIndex](input)) {
        if (value !== null) {
          substack.push([ruleIndex + 1, rest, [...concatValue, [type, value]]])
        }
      }
    }
    stack = [...substack, ...stack]
  }

  if (!flag) {
    yield [['CONCAT', null], input]
  }
}

const DISJUNCTION = module.exports.DISJUNCTION = (...rules) => function* DISJUNCTION (input) {
  for (let i = 0; i < rules.length; i++) {
    const [[type, value], rest] = rules[i](input)
    if (value !== null) {
      yield [['DISJUNCTION', [type, value]], rest]
    }
  }
  yield [['DISJUNCTION', null], input]
}

const OPTION = module.exports.OPTION = rule => function* OPTION (input) {
  const [[type, value], rest] = rule(input)
  return value !== null
	  ? [['OPTION', [type, value]], rest]
	  : [['OPTION'], input]
}

const CLOSURE = module.exports.CLOSURE = rule => function* CLOSURE (input) {
  let [[type, value], rest] = rule(input)
  let result = [], partial
  while (value !== null) {
    result.push([type, value])
    partial = rule(rest)
    type = partial[0][0]
    value = partial[0][1]
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

const EXPECT = module.exports.EXPECT = (rule, expected) => (input, { original = input, errors = [], ...configs}) => {
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