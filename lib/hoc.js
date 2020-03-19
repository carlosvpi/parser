const MATCH = module.exports.MATCH = regex => (input, index) => {
  const match = input.slice(index).match(regex)
  if (!match || match.index !== 0) {
    return [[null], index, []]
  } else {
    return [[MATCH.type, ...match], index + match[0].length, []]
  }
}
MATCH.type = '$MATCH'

const LITERAL = module.exports.LITERAL = literal => (input, index) => {
  if (input.slice(index).indexOf(literal) === 0) {
    return [[LITERAL.type, literal], index + literal.length, []]
  }
  return [[null], index, []]
}
LITERAL.type = '$LITERAL'

const CONCAT = module.exports.CONCAT = (...rules) => (input, index) => {
  let children, endIndex, root, result = [], itemErrors, errors = [], originalIndex = index
  for (let i = 0; i < rules.length; i++) {
    [[root, ...children], endIndex, itemErrors] = rules[i](input, index)

    errors.push(...itemErrors)
    if (root === null) {
      return [[null], originalIndex, errors]
    } else {
      index = endIndex
      result.push([root, ...children])
    }
  }
  return [[CONCAT.type, ...result], index, errors]
}
CONCAT.type = '$CONCAT'

const DISJUNCTION = module.exports.DISJUNCTION = (...rules) => (input, index) => {
  let node, endIndex, root, itemErrors, errors = []
  for (let i = 0; i < rules.length; i++) {
    [[root, ...node], endIndex, itemErrors] = rules[i](input, index)
    errors.push(...itemErrors)
    if (root !== null) {
      return [[root, ...node], endIndex, errors]
    }
  }
  return [[null], index, errors]
}

const OPTION = module.exports.OPTION = rule => (input, index) => {
  const [[root, ...node], endIndex, errors] = rule(input, index)
  return node.length
    ? [[root, ...node], endIndex, errors]
    : [[CONCAT.type], index, []]
}

const CLOSURE = module.exports.CLOSURE = rule => (input, index) => {
  let [[root, ...node], endIndex, errors] = rule(input, index)
  let result = [], partial
  while (root) {
    result.push([root, ...node])
    partial = rule(input, endIndex)
    root = partial[0][0]
    node = partial[0].slice(1)
    endIndex = partial[1]
    errors.push(...partial[2])
  }
  return [[CONCAT.type, ...result], endIndex, errors]
}

const REPETITION = module.exports.REPETITION = (times, rule) => (input, index) => {
  let root, node, endIndex, result = [], itemErrors, errors = []
  for (let i = 0; i < times; i++) {
    [[root, ...node], endIndex, itemErrors] = rule(input, index)
    errors.push(...itemErrors)
    if (root === null) {
      return [[null], index, errors]
    }
    index = endIndex
    result.push([root, ...node])
  }
  return [[CONCAT.type, ...result], index, errors]
}

const EXCEPTION = module.exports.EXCEPTION = (rule, exceptRule = () => [[null]]) => (input, index) => {
  const [[root, ...node], endIndex, errors] = rule(input, index)
  const [[exceptRoot]] = exceptRule(input, index)
  if (!root || exceptRoot) {
    return [[null], index, errors]
  }
  return [[root, ...node], endIndex, errors]
}

const EXPECT = module.exports.EXPECT = (rule, expected) => (input, index) => {
  const result = rule(input, index)
  let [[root, ...node], endIndex, errors] = result
  if (root === null) {
    const got = input.length <= endIndex
      ? 'end of input'
      : `'${input.slice(index, index + 40).split("\n").join("\\n")}...'`
    const lines = input.length <= endIndex
      ? input.split('\n')
      : input.slice(0, index).split('\n')
    const line = lines.length
    const col = lines[line - 1].length
    errors.push(`✘ ${line}:${col} | Expected '${expected}', got ${got}`)
    let auxIndex = index, newErrors = []
    if (auxIndex < input.length) {
      do {
        [[root, ...node], endIndex, newErrors] = rule(input, ++auxIndex)
      } while(!root && auxIndex < input.length)
    }
    return [[root, ...node], endIndex, [...errors, ...newErrors]]
  }
  return result
}
