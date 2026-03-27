const ensureValue = (iterator, option) => {
  const next = iterator.next();
  if (next.done || typeof next.value !== "string" || next.value.startsWith("--")) {
    throw new Error(`Missing value for ${option}`);
  }

  return next.value;
};

export const parseCliArgs = (rawArgs, definitions) => {
  const result = {};
  const iterator = rawArgs[Symbol.iterator]();

  for (const option of iterator) {
    const definition = definitions[option];
    if (!definition) {
      throw new Error(`Unsupported argument: ${option}`);
    }

    if (definition.type === "flag") {
      result[definition.key] = true;
      continue;
    }

    const value = ensureValue(iterator, option);
    if (definition.type === "multi") {
      result[definition.key] = [...(result[definition.key] ?? []), value];
      continue;
    }

    result[definition.key] = value;
  }

  for (const definition of Object.values(definitions)) {
    if (!(definition.key in result) && "defaultValue" in definition) {
      result[definition.key] = definition.defaultValue;
    }

    if (definition.required && !(definition.key in result)) {
      throw new Error(definition.description);
    }
  }

  return result;
};

const tokenizeCommand = (body) => {
  const firstNonEmptyLine = body
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!firstNonEmptyLine) {
    return [];
  }

  return [...firstNonEmptyLine.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/gu)].map(
    (match) => match[1] ?? match[2] ?? match[3]
  );
};

export const parseNamedCommand = ({ body, prefix, definitions }) => {
  const tokens = tokenizeCommand(body);
  if (!tokens.length || tokens[0] !== prefix) {
    return { matched: false };
  }

  return {
    matched: true,
    values: parseCliArgs(tokens.slice(1), definitions),
  };
};
