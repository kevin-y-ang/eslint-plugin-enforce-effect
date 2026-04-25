declare const sql: (strings: TemplateStringsArray) => unknown;

export const query = sql<string>`select 1`;
