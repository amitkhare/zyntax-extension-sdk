/** Bounded syntax shared by theme authoring tools and host asset validators. */
export const TEXTMATE_SELECTOR_RULES = Object.freeze({
  maxLength: 512,
  maxParts: 24,
  maxNodes: 64,
  maxDepth: 8,
  scopePattern: "^\\.?[A-Za-z0-9_*][A-Za-z0-9_.*-]*$",
});

export type TextMateSelector =
  | Readonly<{
      type: "path";
      scopes: readonly string[];
      relations: readonly ("descendant" | "child")[];
    }>
  | Readonly<{ type: "any" | "all"; terms: readonly TextMateSelector[] }>
  | Readonly<{ type: "not"; term: TextMateSelector }>;

const scopeName = new RegExp(TEXTMATE_SELECTOR_RULES.scopePattern, "u");
const scopeStart = /[A-Za-z0-9_*.]/u;
const scopeCharacter = /[A-Za-z0-9_.*-]/u;

/**
 * Parses the supported TextMate selector subset without matching editor scopes.
 * Comma is OR; |, & and subtraction are equally binding, left-associative.
 * Parentheses and unary minus bind first. Anchors/side filters are unsupported.
 */
export function parseTextMateSelector(value: unknown): TextMateSelector {
  if (typeof value !== "string" || !value || value !== value.trim() ||
      value.length > TEXTMATE_SELECTOR_RULES.maxLength) {
    throw new TypeError("TextMate selector must be a nonempty trimmed string within the length limit");
  }
  const tokens: string[] = [];
  let parts = 0;
  for (let cursor = 0; cursor < value.length;) {
    const character = value[cursor];
    if (character === " " || character === "\t") { cursor++; continue; }
    if (scopeStart.test(character)) {
      const start = cursor++;
      while (cursor < value.length && scopeCharacter.test(value[cursor])) cursor++;
      const name = value.slice(start, cursor);
      if (!scopeName.test(name)) throw new TypeError("TextMate selector scope is invalid");
      tokens.push(name);
      parts++;
    } else if ("()|&-,>".includes(character)) {
      tokens.push(character);
      cursor++;
      if (character === ">") parts++;
    } else {
      throw new TypeError("TextMate selector contains unsupported syntax");
    }
    if (parts > TEXTMATE_SELECTOR_RULES.maxParts) {
      throw new TypeError("TextMate selector exceeds the path-parts limit");
    }
  }

  let cursor = 0;
  let nodes = 0;
  function node(result: TextMateSelector): TextMateSelector {
    if (++nodes > TEXTMATE_SELECTOR_RULES.maxNodes) {
      throw new TypeError("TextMate selector exceeds the node limit");
    }
    return Object.freeze(result);
  }
  function binary(type: "any" | "all", left: TextMateSelector, right: TextMateSelector) {
    return node({ type, terms: Object.freeze([left, right]) });
  }
  function negate(term: TextMateSelector) { return node({ type: "not", term }); }
  function depthLimit(depth: number) {
    if (depth > TEXTMATE_SELECTOR_RULES.maxDepth) {
      throw new TypeError("TextMate selector exceeds the nesting limit");
    }
  }
  function operand(depth: number): TextMateSelector {
    depthLimit(depth);
    if (tokens[cursor] === "(") {
      cursor++;
      const result = selector(depth + 1);
      if (tokens[cursor++] !== ")") throw new TypeError("TextMate selector group is unclosed");
      return result;
    }
    const scopes: string[] = [];
    const relations: ("descendant" | "child")[] = [];
    while (cursor < tokens.length && scopeName.test(tokens[cursor])) {
      scopes.push(tokens[cursor++]);
      if (tokens[cursor] === ">") {
        cursor++;
        if (cursor >= tokens.length || !scopeName.test(tokens[cursor])) {
          throw new TypeError("TextMate child operator requires a following scope");
        }
        relations.push("child");
      } else if (cursor < tokens.length && scopeName.test(tokens[cursor])) {
        relations.push("descendant");
      } else break;
    }
    if (!scopes.length) throw new TypeError("TextMate selector requires an operand");
    return node({ type: "path", scopes: Object.freeze(scopes), relations: Object.freeze(relations) });
  }
  function expression(depth: number): TextMateSelector {
    depthLimit(depth);
    if (tokens[cursor] === "-") {
      cursor++;
      return negate(operand(depth + 1));
    }
    return operand(depth);
  }
  function composite(depth: number): TextMateSelector {
    let result = expression(depth);
    while (tokens[cursor] === "|" || tokens[cursor] === "&" || tokens[cursor] === "-") {
      const operator = tokens[cursor++];
      const right = expression(depth);
      result = binary(operator === "|" ? "any" : "all", result, operator === "-" ? negate(right) : right);
    }
    return result;
  }
  function selector(depth: number): TextMateSelector {
    let result = composite(depth);
    while (tokens[cursor] === ",") {
      cursor++;
      result = binary("any", result, composite(depth));
    }
    return result;
  }
  const result = selector(0);
  if (cursor !== tokens.length) throw new TypeError("TextMate selector contains an unexpected token");
  return result;
}
