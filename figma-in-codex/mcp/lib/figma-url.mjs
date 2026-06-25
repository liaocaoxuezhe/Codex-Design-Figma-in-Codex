export function normalizeFigmaNodeId(nodeId) {
  if (typeof nodeId !== "string" || nodeId.trim() === "") return undefined;
  return nodeId.trim().replace(/-/g, ":");
}

function decodePathPart(value) {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function parseFigmaUrl(input) {
  if (typeof input !== "string" || input.trim() === "") {
    return { ok: false, error: "No Figma URL was provided." };
  }

  let url;
  try {
    url = new URL(input.trim());
  } catch {
    return { ok: false, error: "The provided value is not a valid URL." };
  }

  if (!/(^|\.)figma\.com$/i.test(url.hostname)) {
    return { ok: false, error: "The URL is not a figma.com URL.", url: input };
  }

  const parts = url.pathname.split("/").filter(Boolean);
  const kind = parts[0];
  const result = {
    ok: true,
    url: url.toString(),
    kind,
    nodeId: normalizeFigmaNodeId(url.searchParams.get("node-id") ?? undefined),
    rawNodeId: url.searchParams.get("node-id") ?? undefined,
  };

  if (kind === "design") {
    const originalFileKey = parts[1];
    if (!originalFileKey) return { ok: false, error: "The design URL does not include a file key.", url: input };

    const branchIndex = parts.indexOf("branch");
    if (branchIndex === 2 && parts[3]) {
      return {
        ...result,
        fileKey: parts[3],
        originalFileKey,
        fileName: decodePathPart(parts[4]),
      };
    }

    return {
      ...result,
      fileKey: originalFileKey,
      fileName: decodePathPart(parts[2]),
    };
  }

  if (kind === "board" || kind === "slides") {
    if (!parts[1]) return { ok: false, error: `The ${kind} URL does not include a file key.`, url: input };
    return {
      ...result,
      fileKey: parts[1],
      fileName: decodePathPart(parts[2]),
    };
  }

  if (kind === "make") {
    if (!parts[1]) return { ok: false, error: "The make URL does not include a file key.", url: input };
    return {
      ...result,
      fileKey: parts[1],
      fileName: decodePathPart(parts[2]),
      nodeId: result.nodeId ?? "0:1",
    };
  }

  return { ok: false, error: `Unsupported Figma URL kind: ${kind ?? "unknown"}.`, url: input };
}
