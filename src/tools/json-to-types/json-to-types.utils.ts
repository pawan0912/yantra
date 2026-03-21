const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;

type JsonType = "string" | "number" | "boolean" | "null" | "object" | "array";

export function detectJsonType({ value }: { value: unknown }): JsonType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") return t;
  if (t === "object") return "object";
  return "string";
}

// ---------------------------------------------------------------------------
// JSON -> TypeScript
// ---------------------------------------------------------------------------

export function jsonToTypeScript({
  input,
  rootName = "Root",
}: {
  input: string;
  rootName?: string;
}): string {
  const parsed: unknown = JSON.parse(input);
  const interfaces: string[] = [];

  function tsType({ value, name }: { value: unknown; name: string }): string {
    const kind = detectJsonType({ value });

    if (kind === "null") return "null";
    if (kind === "string") return "string";
    if (kind === "number") return "number";
    if (kind === "boolean") return "boolean";

    if (kind === "array") {
      const arr = value as unknown[];
      if (arr.length === 0) return "unknown[]";

      const elementTypes = arr.map((el, i) =>
        tsType({ value: el, name: `${name}Item${i > 0 ? i : ""}` })
      );
      const unique = [...new Set(elementTypes)];

      if (unique.length === 1) return `${unique[0]}[]`;
      return `(${unique.join(" | ")})[]`;
    }

    // object — emit a named interface
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    const lines: string[] = [];

    for (const key of keys) {
      const child = obj[key];
      const childName = toPascal(key);
      const childType = tsType({ value: child, name: childName });
      const isNullable = child === null;
      const optional = isNullable ? "?" : "";
      lines.push(`  ${safePropName(key)}${optional}: ${childType};`);
    }

    const ifaceName = toPascal(name);
    interfaces.push(`export interface ${ifaceName} {\n${lines.join("\n")}\n}`);
    return ifaceName;
  }

  const rootType = tsType({ value: parsed, name: rootName });

  // If the root is a primitive or array, emit a type alias instead
  if (!interfaces.length || rootType !== toPascal(rootName)) {
    return `export type ${toPascal(rootName)} = ${rootType};\n`;
  }

  // Reverse so root interface comes first
  return interfaces.reverse().join("\n\n") + "\n";
}

// ---------------------------------------------------------------------------
// JSON -> Zod
// ---------------------------------------------------------------------------

export function jsonToZod({
  input,
  rootName = "Root",
}: {
  input: string;
  rootName?: string;
}): string {
  const parsed: unknown = JSON.parse(input);
  const schemas: string[] = [];

  function zodType({ value, name }: { value: unknown; name: string }): string {
    const kind = detectJsonType({ value });

    if (kind === "null") return "z.null()";
    if (kind === "boolean") return "z.boolean()";
    if (kind === "number") return "z.number()";
    if (kind === "string") {
      const s = value as string;
      if (ISO_DATE_RE.test(s)) {
        return "z.string() /* .datetime() or .transform(v => new Date(v)) */";
      }
      return "z.string()";
    }

    if (kind === "array") {
      const arr = value as unknown[];
      if (arr.length === 0) return "z.array(z.unknown())";

      const elementTypes = arr.map((el, i) =>
        zodType({ value: el, name: `${name}Item${i > 0 ? i : ""}` })
      );
      const unique = [...new Set(elementTypes)];

      if (unique.length === 1) return `z.array(${unique[0]})`;
      return `z.array(z.union([${unique.join(", ")}]))`;
    }

    // object — emit a named schema variable
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    const fields: string[] = [];

    for (const key of keys) {
      const child = obj[key];
      const childName = toPascal(key);
      let childSchema = zodType({ value: child, name: childName });

      if (child === null) {
        childSchema = "z.nullable(z.unknown())";
      }

      fields.push(`  ${safePropName(key)}: ${childSchema},`);
    }

    const schemaName = toCamel(name) + "Schema";
    schemas.push(
      `export const ${schemaName} = z.object({\n${fields.join("\n")}\n});`
    );
    return schemaName;
  }

  const rootSchema = zodType({ value: parsed, name: rootName });

  const importLine = 'import { z } from "zod";\n';

  if (!schemas.length || rootSchema !== toCamel(rootName) + "Schema") {
    return `${importLine}\nexport const ${toCamel(rootName)}Schema = ${rootSchema};\n`;
  }

  return importLine + "\n" + schemas.reverse().join("\n\n") + "\n";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toPascal(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^./, (c) => c.toUpperCase());
}

function toCamel(s: string): string {
  const p = toPascal(s);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

function safePropName(key: string): string {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
}

export function countFields({ input }: { input: string }): number {
  const parsed: unknown = JSON.parse(input);
  let count = 0;

  function walk(value: unknown): void {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      const keys = Object.keys(value as Record<string, unknown>);
      count += keys.length;
      keys.forEach((k) => walk((value as Record<string, unknown>)[k]));
    } else if (Array.isArray(value)) {
      value.forEach((el) => walk(el));
    }
  }

  walk(parsed);
  return count;
}
