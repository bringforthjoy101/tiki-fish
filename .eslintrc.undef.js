/**
 * Catches ReferenceErrors before they reach a user. NOT part of the build.
 *
 * WHY THIS EXISTS AS A SEPARATE CONFIG
 *
 * Neither existing check finds an undefined identifier:
 *
 *   npm run build   compiles it happily. Calling a function that does not exist is valid
 *                   JavaScript, so it ships and blows up at runtime as a blank white page.
 *                   This is not hypothetical — `readable is not defined` reached the "What
 *                   sold" report that way, through a build that reported "Compiled
 *                   successfully."
 *
 *   npm run lint    uses `eslintConfig: { extends: "react-app" }` from package.json, whose
 *                   parser rejects optional chaining. It reports "Parsing error: Unexpected
 *                   token ." on almost every modern file in src/ and never evaluates a single
 *                   rule, so it cannot catch this or anything else.
 *
 * This config uses babel-eslint — the parser the app itself compiles with — and turns on
 * no-undef, which is all that is needed.
 *
 * USE IT on anything you have edited, before committing:
 *
 *   npx eslint --no-eslintrc -c .eslintrc.undef.js src/views/tiki-fish/reports/
 *
 * Exit 0 with no output means clean. Verified against a deliberately broken copy first —
 * a checker that reports nothing may simply be broken.
 */
module.exports = {
	parser: 'babel-eslint',
	parserOptions: { ecmaVersion: 2021, sourceType: 'module', ecmaFeatures: { jsx: true } },
	env: { browser: true, es2021: true, node: true },
	rules: { 'no-undef': 'error' },
}
