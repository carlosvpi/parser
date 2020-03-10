const MATCH = module.exports.MATCH = regex => {
  const resultRule = (input, ...configs) => {
    const match = input.match(regex)
    if (!match || match.index !== 0) {
      return [[null], input]
    } else {
      return [['MATCH', match[0]], input.slice(match[0].length)]
    }
  }
  resultRule.ruleName = `/${regex}/`
  return resultRule
}

const LITERAL = module.exports.LITERAL = literal => {
  const resultRule = (input, ...configs) => {
    if (input.indexOf(literal) === 0) {
      return [['LITERAL', literal], input.slice(literal.length)]
    }
    return [[null], input]
  }
  resultRule.ruleName = `'${literal}'`
  return resultRule
}

const CONCAT = module.exports.CONCAT = (...rules) => {
  const resultRule = (input, ...configs) => {
    let node, rest, root, result = []
    const originalInput = input
    for (let i = 0; i < rules.length; i++) {
      [[root, node], rest] = rules[i](input, ...configs)
      if (root === null) {
        return [[null], originalInput]
      } else {
        input = rest
        result.push([root, node])
      }
    }
    return [['LIST', result], input]
  }
  resultRule.ruleName = `(${rules.map(({ ruleName }) => ruleName).join(' ')})`
  return resultRule
}

const DISJUNCTION = module.exports.DISJUNCTION = (...rules) => {
  const resultRule = (input, ...configs) => {
    let node, rest, root
    for (let i = 0; i < rules.length; i++) {
      [[root, node], rest] = rules[i](input, ...configs)
      if (node) {
        return [[root, node], rest]
      }
    }
    return [[null], input]
  }
  resultRule.ruleName = `(${rules.map(({ ruleName }) => ruleName).join(' | ')})`
  return resultRule
}

const OPTION = module.exports.OPTION = rule => {
  const resultRule = (input, ...configs) => {
    const [[root, node], rest] = rule(input, ...configs)
    return node
      ? [[root, node], rest]
      : [['LIST', []], input]
  }
  resultRule.ruleName = `${rule.ruleName}?`
  return resultRule
}

const CLOSURE = module.exports.CLOSURE = rule => {
  const resultRule = (input, ...configs) => {
    let [[root, node], rest] = rule(input, ...configs)
    let result = [], partial
    while (node) {
      result.push([root, node])
      partial = rule(rest, ...configs)
      root = partial[0][0]
      node = partial[0][1]
      rest = partial[1]
    }
    return [['LIST', result], rest]
  }
  resultRule.ruleName = `${rule.ruleName}*`
  return resultRule
}

const REPETITION = module.exports.REPETITION = (times, rule) => {
  const resultRule = (input, ...configs) => {
    let root, node, rest, result = []
    for (let i = 0; i < times; i++) {
      [[root, node], rest] = rule(input, ...configs)
      if (!node) {
        return [[null], input]
      }
      input = rest
      result.push([root, node])
    }
    return [['LIST', result], input]
  }
  resultRule.ruleName = `${times} * ${rule.ruleName}`
  return resultRule
}

const EXCEPTION = module.exports.EXCEPTION = (rule, exceptRule = () => [[null, null]]) => {
  const resultRule = (input, ...configs) => {
    const [[root, node], rest] = rule(input, ...configs)
    const [[_, exceptNode]] = exceptRule(input, ...configs)
    if (!node || exceptNode) {
      return [[null], input]
    }
    return [[root, node], rest]
  }
  resultRule.ruleName = exceptRule.ruleName
    ? `${rule.ruleName} - ${exceptRule.ruleName}`
    : `${rule.ruleName} - 0`
  return resultRule
}

const EXPECT = module.exports.EXPECT = (rule, expected, recoveryRule = (x) => [[null], x]) => {
  const resultRule = (input, { original = input, errors = [], ...configs}) => {
    const result = rule(input, { original, errors, ...configs })
    if (result[0][0] === null) {
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
  resultRule.ruleName = `${rule.ruleName}!`
  return resultRule
}
