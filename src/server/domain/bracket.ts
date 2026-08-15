export type MatchNode = {
  id: string;
  nextMatchId: string | null;
};

export function detectBracketCycle(matches: MatchNode[]): string[] | null {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const byId = new Map(matches.map((match) => [match.id, match]));

  const dfs = (id: string, path: string[]): string[] | null => {
    if (visiting.has(id)) return [...path, id];
    if (visited.has(id)) return null;
    visiting.add(id);
    const nextId = byId.get(id)?.nextMatchId;
    const cycle = nextId ? dfs(nextId, [...path, id]) : null;
    visiting.delete(id);
    visited.add(id);
    return cycle;
  };

  for (const match of matches) {
    const cycle = dfs(match.id, []);
    if (cycle) return cycle;
  }
  return null;
}

export type Advancement = {
  nextMatchId: string;
  nextSlot: "A" | "B";
  winnerId: string;
};

export function buildWinnerAdvancement(params: {
  winnerId: string;
  nextMatchId: string | null;
  nextSlot: "A" | "B" | null;
}): Advancement | null {
  if (!params.nextMatchId || !params.nextSlot) return null;
  return {
    nextMatchId: params.nextMatchId,
    nextSlot: params.nextSlot,
    winnerId: params.winnerId,
  };
}
