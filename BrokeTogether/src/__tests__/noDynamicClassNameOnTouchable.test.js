const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

// Regression guard for a confirmed NativeWind bug: a conditional/template-literal
// `className` directly on a <TouchableOpacity>/<Pressable> can break React Navigation's
// context on re-render (see nativewind/nativewind#1712, #1466, #1536, #1557).
// The fix is to keep the Touchable's own className static and move any conditional
// styling onto a nested <View>/<Text> instead.
//
// This scans every .jsx source file for that exact pattern so it can't silently
// come back when someone adds a new tab bar / toggle button.

const SRC_DIR = path.join(__dirname, '..');
const TOUCHABLE_NAMES = new Set(['TouchableOpacity', 'Pressable', 'TouchableHighlight', 'TouchableWithoutFeedback']);

function listSourceFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listSourceFiles(full));
    } else if (entry.isFile() && /\.jsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function isDynamic(node) {
  // className={`...${expr}...`} or className={cond ? 'a' : 'b'} or className={a + b}
  if (!node) return false;
  if (node.type === 'TemplateLiteral') return node.expressions.length > 0;
  if (node.type === 'ConditionalExpression') return true;
  if (node.type === 'LogicalExpression') return true;
  if (node.type === 'BinaryExpression') return true;
  return false;
}

function findViolations(file) {
  const code = fs.readFileSync(file, 'utf8');
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'classProperties'],
    });
  } catch {
    return [];
  }

  const violations = [];
  traverse(ast, {
    JSXOpeningElement(path) {
      const name = path.node.name;
      if (name.type !== 'JSXIdentifier' || !TOUCHABLE_NAMES.has(name.name)) return;

      for (const attr of path.node.attributes) {
        if (
          attr.type === 'JSXAttribute' &&
          attr.name.name === 'className' &&
          attr.value?.type === 'JSXExpressionContainer' &&
          isDynamic(attr.value.expression)
        ) {
          violations.push(attr.loc?.start.line ?? '?');
        }
      }
    },
  });
  return violations;
}

describe('no dynamic className on Touchable/Pressable components', () => {
  const files = listSourceFiles(SRC_DIR);

  it.each(files)('%s', (file) => {
    const violations = findViolations(file);
    if (violations.length > 0) {
      const relative = path.relative(SRC_DIR, file);
      throw new Error(
        `Found conditional/template-literal className directly on a Touchable/Pressable in ${relative} ` +
        `at line(s) ${violations.join(', ')}. This is a known NativeWind bug that can break React ` +
        `Navigation's context on re-render. Keep the Touchable's className static and move the ` +
        `conditional styling onto a nested View/Text instead.`
      );
    }
  });
});
