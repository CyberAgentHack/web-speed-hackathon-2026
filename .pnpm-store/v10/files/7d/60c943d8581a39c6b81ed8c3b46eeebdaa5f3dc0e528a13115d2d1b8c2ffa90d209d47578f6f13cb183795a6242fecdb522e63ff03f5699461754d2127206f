import { $ as StringToken, A as Ranged, B as CountOptions, C as Suggestion, D as LineColumn, E as Fixer, F as Node, G as KeywordToken, H as IdentifierToken, I as VisitorWithHooks, J as PrivateIdentifierToken, K as NullToken, L as VisitorObject, M as AfterHook, N as BeforeHook, O as Location, P as Comment, Q as SkipOptions, R as types_d_exports, S as DiagnosticData, T as FixFn, U as JSXIdentifierToken, V as FilterFn, W as JSXTextToken, X as RangeOptions, Y as PunctuatorToken, Z as RegularExpressionToken, _ as ScopeManager, a as RuleDeprecatedInfo, at as Envs, b as Settings, c as RuleReplacedByExternalSpecifier, d as LanguageOptions, et as TemplateToken, f as SourceCode, g as Scope, h as Reference, i as Rule, it as RuleOptionsSchema, j as Span, k as Range, l as RuleReplacedByInfo, m as DefinitionType, n as CreateRule, o as RuleDocs, ot as Globals, p as Definition, q as NumericToken, r as Plugin, rt as Options, s as RuleMeta, t as CreateOnceRule, tt as Token, u as Context, v as ScopeType, w as Fix, x as Diagnostic, y as Variable, z as BooleanToken } from "./load.js";
import { n as defineRule, t as definePlugin } from "./define.js";

//#region src-js/package/compat.d.ts
/**
 * Convert a plugin which used Oxlint's `createOnce` API to also work with ESLint.
 *
 * If any of the plugin's rules use the Oxlint alternative `createOnce` API,
 * add ESLint-compatible `create` methods to those rules, which delegate to `createOnce`.
 * This makes the plugin compatible with ESLint.
 *
 * The `plugin` object passed in is mutated in-place.
 *
 * @param plugin - Plugin to convert
 * @returns Plugin with all rules having `create` method
 * @throws {Error} If `plugin` is not an object, or `plugin.rules` is not an object
 */
declare function eslintCompatPlugin(plugin: Plugin): Plugin;
//#endregion
export { type AfterHook, type BeforeHook, type BooleanToken, type Comment, type Context, type CountOptions, type CreateOnceRule, type CreateRule, type Definition, type DefinitionType, type Diagnostic, type DiagnosticData, type types_d_exports as ESTree, type Envs, type FilterFn, type Fix, type FixFn, type Fixer, type Globals, type IdentifierToken, type JSXIdentifierToken, type JSXTextToken, type KeywordToken, type LanguageOptions, type LineColumn, type Location, type Node, type NullToken, type NumericToken, type Options, type Plugin, type PrivateIdentifierToken, type PunctuatorToken, type Range, type RangeOptions, type Ranged, type Reference, type RegularExpressionToken, type Rule, type RuleDeprecatedInfo, type RuleDocs, type RuleMeta, type RuleOptionsSchema, type RuleReplacedByExternalSpecifier, type RuleReplacedByInfo, type Scope, type ScopeManager, type ScopeType, type Settings, type SkipOptions, type SourceCode, type Span, type StringToken, type Suggestion, type TemplateToken, type Token, type Variable, type VisitorObject as Visitor, type VisitorWithHooks, definePlugin, defineRule, eslintCompatPlugin };