// @ts-ignore
import nlp from "wink-nlp-utils";
import { Chunk } from "../../index";
import { deduplicateArray } from "../../util/index";

export function deduplicateChunks(chunks: Chunk[]): Chunk[] {
  return deduplicateArray(chunks, (a, b) => {
    return (
      a.filepath === b.filepath &&
      a.startLine === b.startLine &&
      a.endLine === b.endLine
    );
  });
}

/**
 * Get cleaned trigrams for Full-Text Search
 *
 * Tokenizes, stems, and filters query tokens for FTS.
 *
 * @param query - The search query
 * @returns Array of cleaned trigram tokens
 */
export function getCleanedTrigrams(query: string): string[] {
  return nlp.string
    .tokenize0(query)
    .map((token: string) => nlp.string.stem(token))
    .filter((token: string) => token.length > 2);
}
