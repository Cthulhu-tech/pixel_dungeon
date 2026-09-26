import ts from 'typescript';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
const slash = (s) => s.split(sep).join('/');
function filesAt(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? filesAt(resolve(root, e.name)) : /\.[cm]?tsx?$/.test(e.name) ? [resolve(root, e.name)] : []);
}
export function checkBoundaries(root = resolve('src')) {
  const files = filesAt(root); const known = new Set(files); const edges = new Map(); const errors = [];
  const forbidden = new Set(['window', 'document', 'globalThis', 'localStorage', 'sessionStorage', 'indexedDB', 'navigator', 'fetch', 'XMLHttpRequest', 'Audio', 'AudioContext', 'Date', 'setTimeout', 'setInterval', 'requestAnimationFrame', 'performance', 'process', 'require']);
  for (const file of files) {
    const name = slash(relative(root, file)); const module = /^modules\/([^/]+)\//.exec(name)?.[1];
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const dependencies = []; edges.set(file, dependencies);
    const fail = (node, why) => errors.push(`${name}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}: ${why}`);
    function dependency(node, specifier) {
      if (!specifier.startsWith('.')) {
        if (module || name.startsWith('contracts/')) fail(node, `External or aliased dependency forbidden in pure code: ${specifier}`);
        return;
      }
      const target = ts.resolveModuleName(specifier, file, { moduleResolution: ts.ModuleResolutionKind.Bundler, allowImportingTsExtensions: true }, ts.sys).resolvedModule?.resolvedFileName;
      if (!target || !known.has(resolve(target))) { fail(node, `Unresolved/out-of-src dependency: ${specifier}`); return; }
      const resolved = resolve(target); dependencies.push(resolved);
      const dest = slash(relative(root, resolved)); const other = /^modules\/([^/]+)\//.exec(dest)?.[1];
      if (module && !dest.startsWith(`modules/${module}/`) && !dest.startsWith('contracts/') && !other) fail(node, `Domain cannot import application/adapter: ${dest}`);
      if (other && other !== module && dest !== `modules/${other}/index.ts`) fail(node, `Use the public module API instead of deep import: ${dest}`);
      if (name.startsWith('contracts/') && !dest.startsWith('contracts/')) fail(node, `Shared contracts must not import implementations: ${dest}`);
    }
    function visit(node) {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) dependency(node, node.moduleSpecifier.text);
      }
      if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) dependency(node, node.argument.literal.text);
      if (ts.isImportEqualsDeclaration(node)) fail(node, 'Import-equals/require is not allowed');
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const argument = node.arguments[0];
        if (!argument || !ts.isStringLiteral(argument)) fail(node, 'Computed dynamic imports cannot be boundary-checked');
        else dependency(node, argument.text);
      }
      if (node.kind === ts.SyntaxKind.AnyKeyword) fail(node, 'Explicit any is forbidden');
      if (module && ts.isIdentifier(node) && forbidden.has(node.text)) fail(node, `Browser/time/global API must be injected through a port: ${node.text}`);
      if (module && ts.isPropertyAccessExpression(node) && node.expression.getText(source) === 'Math' && node.name.text === 'random') fail(node, 'Inject RandomSource; do not use Math.random');
      if (module && ts.isElementAccessExpression(node) && node.expression.getText(source) === 'Math' && node.argumentExpression?.getText(source).replace(/["']/g, '') === 'random') fail(node, 'Inject RandomSource; do not use Math[random]');
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  const visiting = new Set(); const complete = new Set();
  function walk(file, trail) {
    if (visiting.has(file)) { errors.push(`Dependency cycle: ${[...trail, file].map((p) => slash(relative(root, p))).join(' -> ')}`); return; }
    if (complete.has(file)) return;
    visiting.add(file);
    for (const target of edges.get(file) ?? []) walk(target, [...trail, file]);
    visiting.delete(file); complete.add(file);
  }
  for (const file of files) walk(file, []);
  return errors;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const errors = checkBoundaries();
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log('Import boundaries: PASS (static policy check, not a security sandbox)');
}
