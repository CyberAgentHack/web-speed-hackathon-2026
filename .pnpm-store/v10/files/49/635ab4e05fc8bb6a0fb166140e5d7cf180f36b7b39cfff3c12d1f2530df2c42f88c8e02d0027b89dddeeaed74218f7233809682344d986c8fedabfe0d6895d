import { S as DiagnosticData, b as Settings, i as Rule, nt as RequireAtLeastOne, rt as Options } from "./load.js";

//#region src-js/package/rule_tester.d.ts
type DescribeFn = (text: string, fn: () => void) => void;
type ItFn = ((text: string, fn: () => void) => void) & {
  only?: ItFn;
};
/**
 * Configuration for `RuleTester`.
 */
interface Config {
  /**
   * ESLint compatibility mode.
   * If `true`, column offsets in diagnostics are incremented by 1, to match ESLint's behavior.
   */
  eslintCompat?: boolean;
  /**
   * Language options.
   */
  languageOptions?: LanguageOptions;
  /**
   * Current working directory for the linter.
   * If not provided, defaults to the directory containing the test file.
   */
  cwd?: string;
}
/**
 * Language options config.
 */
interface LanguageOptions {
  sourceType?: SourceType;
  globals?: Globals;
  env?: Envs;
  parserOptions?: ParserOptions;
}
/**
 * Language options config, with `parser` and `ecmaVersion` properties, and extended `parserOptions`.
 * These properties should not be present in `languageOptions` config,
 * but could be if test cases are ported from ESLint.
 * For internal use only.
 */
/**
 * Source type.
 *
 * `'unambiguous'` is not supported in ESLint compatibility mode.
 */
type SourceType = "script" | "module" | "commonjs" | "unambiguous";
/**
 * Value of a property in `globals` object.
 *
 * Note: `null` only supported in ESLint compatibility mode.
 */
type GlobalValue = boolean | "true" | "writable" | "writeable" | "false" | "readonly" | "readable" | "off" | null;
/**
 * Globals object.
 */
type Globals = Record<string, GlobalValue>;
/**
 * Environments for the file being linted.
 */
type Envs = Record<string, boolean>;
/**
 * Parser options config.
 */
interface ParserOptions {
  ecmaFeatures?: EcmaFeatures;
  /**
   * Language variant to parse file as.
   *
   * If test case provides a filename, that takes precedence over `lang` option.
   * Language will be inferred from file extension.
   */
  lang?: Language;
  /**
   * `true` to ignore non-fatal parsing errors.
   */
  ignoreNonFatalErrors?: boolean;
}
/**
 * Parser options config, with extended `ecmaFeatures`.
 * These properties should not be present in `languageOptions` config,
 * but could be if test cases are ported from ESLint.
 * For internal use only.
 */
/**
 * ECMA features config.
 */
interface EcmaFeatures {
  /**
   * `true` to enable JSX parsing.
   *
   * `parserOptions.lang` takes priority over this option, if `lang` is specified.
   */
  jsx?: boolean;
}
/**
 * ECMA features config, with `globalReturn` and `impliedStrict` properties.
 * These properties should not be present in `ecmaFeatures` config,
 * but could be if test cases are ported from ESLint.
 * For internal use only.
 */
/**
 * Parser language.
 */
type Language = "js" | "jsx" | "ts" | "tsx" | "dts";
/**
 * Test case.
 */
interface TestCase extends Config {
  code: string;
  name?: string;
  only?: boolean;
  filename?: string;
  options?: Options;
  settings?: Settings;
  before?: (this: this) => void;
  after?: (this: this) => void;
}
/**
 * Test case for valid code.
 */
interface ValidTestCase extends TestCase {}
/**
 * Test case for invalid code.
 */
interface InvalidTestCase extends TestCase {
  output?: string | null;
  errors: number | ErrorEntry[];
}
type ErrorEntry = Error | string | RegExp;
/**
 * Expected error.
 */
type Error = RequireAtLeastOne<ErrorBase, "message" | "messageId">;
interface ErrorBase {
  message?: string | RegExp;
  messageId?: string;
  data?: DiagnosticData;
  line?: number;
  column?: number;
  endLine?: number | undefined;
  endColumn?: number | undefined;
}
/**
 * Test cases for a rule.
 */
interface TestCases {
  valid: (ValidTestCase | string)[];
  invalid: InvalidTestCase[];
}
/**
 * Utility class for testing rules.
 */
declare class RuleTester {
  #private;
  /**
   * Creates a new instance of RuleTester.
   * @param config? - Extra configuration for the tester (optional)
   */
  constructor(config?: Config | null);
  /**
   * Set the configuration to use for all future tests.
   * @param config - The configuration to use
   * @throws {TypeError} If `config` is not an object
   */
  static setDefaultConfig(config: Config): void;
  /**
   * Get the current configuration used for all tests.
   * @returns The current configuration
   */
  static getDefaultConfig(): Config;
  /**
   * Reset the configuration to the initial configuration of the tester removing
   * any changes made until now.
   * @returns {void}
   */
  static resetDefaultConfig(): void;
  static get describe(): DescribeFn;
  static set describe(value: DescribeFn);
  static get it(): ItFn;
  static set it(value: ItFn);
  static get itOnly(): ItFn;
  static set itOnly(value: ItFn);
  /**
   * Add the `only` property to a test to run it in isolation.
   * @param item - A single test to run by itself
   * @returns The test with `only` set
   */
  static only(item: string | TestCase): TestCase;
  /**
   * Adds a new rule test to execute.
   * @param ruleName - Name of the rule to run
   * @param rule - Rule to test
   * @param tests - Collection of tests to run
   * @throws {TypeError|Error} If `rule` is not an object with a `create` method,
   *   or if non-object `test`, or if a required scenario of the given type is missing
   */
  run(ruleName: string, rule: Rule, tests: TestCases): void;
}
type _Config = Config;
type _LanguageOptions = LanguageOptions;
type _Globals = Globals;
type _Envs = Envs;
type _ParserOptions = ParserOptions;
type _SourceType = SourceType;
type _Language = Language;
type _EcmaFeatures = EcmaFeatures;
type _DescribeFn = DescribeFn;
type _ItFn = ItFn;
type _ValidTestCase = ValidTestCase;
type _InvalidTestCase = InvalidTestCase;
type _TestCases = TestCases;
type _Error = Error;
declare namespace RuleTester {
  type Config = _Config;
  type LanguageOptions = _LanguageOptions;
  type Globals = _Globals;
  type Envs = _Envs;
  type ParserOptions = _ParserOptions;
  type SourceType = _SourceType;
  type Language = _Language;
  type EcmaFeatures = _EcmaFeatures;
  type DescribeFn = _DescribeFn;
  type ItFn = _ItFn;
  type ValidTestCase = _ValidTestCase;
  type InvalidTestCase = _InvalidTestCase;
  type TestCases = _TestCases;
  type Error = _Error;
}
//#endregion
export { RuleTester as t };