// Funniest Time Machine Warning Label — deterministic entry picker.
//
// The brief asks for one warning label of at most 120 characters. An AI
// judge compares labels pairwise, weighing, most important first:
//   1. Is it the funniest warning label for a time machine?
//   2. Does it turn a real hazard of time travel (a paradox, a duplicate
//      self, a stranded ancestor) into the joke instead of naming it flatly?
//   3. Does it save the surprise for the last few words?
//   4. Is it phrased like a genuine safety notice, keeping a straight face?
//   5. Does it waste no words inside the character limit?
//
// This program scores a set of hand-written candidate one-liners against
// those five criteria, in that order (weights 5, 4, 3, 2, 1), writes the
// winner to $MAKEFUN_OUTPUT_DIR/entry.txt (fallback /output/entry.txt),
// reads it back and verifies it against every gate before exiting.
//
// Revision pass: 14 candidates (4 added), and a sharper scorer —
// criterion 2 now caps a label that only names hazards flatly, with no
// consequence the hazard turns into; criterion 1 docks the shopworn
// "kill your grandfather" gag, the single most predictable time-travel
// joke; criterion 3 now requires the twist to sit inside the last six
// words, not merely somewhere in the final clause; and ties break by the
// criterion vector in the brief's own order, the way the judge itself
// walks the criteria, before falling back to shorter length.
//
// Node 22, standard library only, no network, fully deterministic: the
// same candidates always produce the same winner.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------- candidates

const CANDIDATES: string[] = [
  "WARNING: Do not attempt to prevent your own birth. Refunds are not issued to nonexistent customers.",
  "NOTICE: Passengers who kill their own grandfather will be charged a full fare for the return trip.",
  "CAUTION: If you meet yourself, remain calm. Only one of you may keep the parking validation.",
  "WARNING: Do not wave at your past self. He knows what you did, and he is telling everyone.",
  "CAUTION: Arriving before you departed may create a duplicate passenger. Both of you will be charged.",
  "WARNING: This machine is not responsible for ancestors you strand, paradoxes you cause, or selves you meet.",
  "NOTICE: Meeting yourself voids the warranty. Arguing with yourself voids the return trip.",
  "WARNING: Do not step out before you were born. Your mother will not recognize you, and neither will you.",
  "CAUTION: Killing your grandfather cancels your ticket, your return trip, and your existence. No refunds.",
  "WARNING: If you encounter your future self, do not ask questions. He is here because you did not listen.",
  // Revision additions: each turns a different hazard into the joke and
  // lands its surprise in the final words.
  "NOTICE: If you meet your own corpse, do not introduce yourself. It already knows how this ends.",
  "WARNING: Do not tell your grandfather about the future. He will invest in it, and you will never be born.",
  "WARNING: Do not undo your own mistakes. You will be charged for watching yourself make them twice.",
  "CAUTION: Passengers who arrive before they departed will be charged twice: once now, and once before.",
];

// ------------------------------------------------------- scorer lexicons
// All lexicons are plain word lists checked against the candidate text
// itself; no candidate carries a pre-assigned score.

const WEIGHTS = [5, 4, 3, 2, 1]; // brief order: criterion 1 matters most.

const HEADERS = ["WARNING:", "CAUTION:", "NOTICE:"];

// Words naming a real hazard of time travel (criterion 2).
const HAZARDS = [
  "grandfather",
  "birth",
  "born",
  "corpse",
  "yourself",
  "duplicate",
  "ancestor",
  "paradox",
  "stranded",
  "timeline",
  "past self",
  "future self",
  "departed",
  "existence",
];

// Words naming the consequence the hazard turns into (criterion 2).
const CONSEQUENCES = [
  "void",
  "voids",
  "charged",
  "refund",
  "refunds",
  "cancel",
  "cancels",
  "fare",
  "nonexistent",
  "never be born",
];

// Twist words that land the laugh in the final clause (criterion 3).
const STRONG_TWISTS = [
  "nonexistent",
  "parking validation",
  "telling everyone",
  "did not listen",
  "neither will you",
  "already filed",
  "how this ends",
  "never be born",
  "make them twice",
  "once before",
];
const MEDIUM_TWISTS = [
  "charged",
  "fare",
  "refund",
  "refunds",
  "void",
  "voids",
  "existence",
  "cancel",
  "cancels",
];

// Markers of genuine safety-notice register (criterion 4).
const FORMAL_MARKERS = [
  "do not",
  "passengers",
  "remain calm",
  "not responsible",
  "not issued",
  "will be charged",
  "voids the",
  "cancels your",
];
// Markers that break the straight face (criterion 4).
const INFORMAL_MARKERS = [
  "telling everyone",
  "did not listen",
  "wave at",
  "arguing",
];

// Words that do no work inside the character limit (criterion 5).
const FILLERS = [
  "please",
  "note",
  "very",
  "just",
  "really",
  "simply",
  "actually",
  "kindly",
  "remember",
  "that",
];

// ------------------------------------------------------------------ helpers

function lower(text: string): string {
  return text.toLowerCase();
}

function containsAny(text: string, words: string[]): boolean {
  const hay = lower(text);
  return words.some((w) => hay.includes(w));
}

function countDistinct(text: string, words: string[]): number {
  const hay = lower(text);
  return words.filter((w) => hay.includes(w)).length;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

// The final clause is everything after the last sentence break; that is
// where the surprise has to land (criterion 3).
function finalClause(text: string): string {
  const idx = text.lastIndexOf(". ");
  return idx === -1 ? text : text.slice(idx + 2);
}

// The last few words of the text, joined: the surprise must land here,
// not merely somewhere in the final clause.
function lastWords(text: string, n: number): string {
  const words = lower(text).split(/\s+/).filter((w) => w.length > 0);
  return words.slice(-n).join(" ");
}

// The most predictable time-travel gag in the set: killing one's own
// grandfather is the first joke every reader expects, so a label built
// on it has to work harder to be the funniest (criterion 1).
function isStaleGag(text: string): boolean {
  const hay = lower(text);
  return hay.includes("grandfather") && (hay.includes("kill") || hay.includes("killing"));
}

// ------------------------------------------------------------- per-criterion

function scoreCriterion1(text: string): number {
  const header = HEADERS.some((h) => text.startsWith(h)) ? 0.5 : 0;
  const hazard = containsAny(text, HAZARDS) ? 0.5 : 0;
  const stale = isStaleGag(text) ? 0.3 : 0;
  return clamp01(header + hazard - stale);
}

function scoreCriterion2(text: string): number {
  const hazards = countDistinct(text, HAZARDS);
  const consequences = countDistinct(text, CONSEQUENCES);
  // Naming hazards flatly, with no consequence the hazard turns into,
  // is exactly what the brief warns against: cap it well below full marks.
  if (consequences === 0) return clamp01(0.3 * hazards);
  return clamp01(0.35 * hazards + 0.35 * consequences);
}

function scoreCriterion3(text: string): number {
  const tail = lastWords(text, 6);
  const clause = lower(finalClause(text));
  if (STRONG_TWISTS.some((w) => tail.includes(w))) return 1.0;
  if (STRONG_TWISTS.some((w) => clause.includes(w))) return 0.85;
  if (MEDIUM_TWISTS.some((w) => tail.includes(w))) return 0.75;
  if (MEDIUM_TWISTS.some((w) => clause.includes(w))) return 0.6;
  return 0.4;
}

function scoreCriterion4(text: string): number {
  const formal = containsAny(text, FORMAL_MARKERS) ? 0.5 : 0;
  const informal = containsAny(text, INFORMAL_MARKERS) ? 0.25 : 0;
  return clamp01(0.5 + formal - informal);
}

function scoreCriterion5(text: string): number {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const filler = words.filter((w) =>
    FILLERS.includes(lower(w).replace(/[^a-z]/g, "")),
  ).length;
  let score = words.length === 0 ? 0 : 1 - filler / words.length;
  const len = [...text].length;
  if (len > 105) score -= (len - 105) * 0.01; // long for its own sake
  return clamp01(score);
}

const CRITERION_SCORERS = [
  scoreCriterion1,
  scoreCriterion2,
  scoreCriterion3,
  scoreCriterion4,
  scoreCriterion5,
];

interface Scored {
  text: string;
  criteria: number[];
  total: number;
}

function scoreCandidate(text: string): Scored {
  const criteria = CRITERION_SCORERS.map((fn) => fn(text));
  const total = criteria.reduce((sum, c, i) => sum + WEIGHTS[i] * c, 0);
  return { text, criteria, total };
}

// --------------------------------------------------------------------- gate

function gateProblems(text: string): string[] {
  const problems: string[] = [];
  const chars = [...text]; // code points, not UTF-16 units
  if (chars.length < 1 || chars.length > 120) {
    problems.push(`length ${chars.length} outside 1..120 characters`);
  }
  if (text.trim().length === 0) problems.push("only whitespace");
  if (text.includes("\n") || text.includes("\r")) {
    problems.push("not a single line");
  }
  if (Buffer.from(text, "utf8").toString("utf8") !== text) {
    problems.push("not valid UTF-8 round-trip");
  }
  return problems;
}

// --------------------------------------------------------------------- main

function main(): void {
  // 1. Keep only gate-valid candidates.
  const valid = CANDIDATES.filter((c) => {
    const problems = gateProblems(c);
    if (problems.length > 0) {
      console.error(`excluded candidate (${problems.join("; ")}): ${c}`);
      return false;
    }
    return true;
  });
  if (valid.length === 0) {
    console.error("no gate-valid candidate");
    process.exit(1);
  }

  // 2. Score every candidate, deterministically. Ties break the way the
  // judge walks the brief: criterion by criterion, in the brief's order,
  // then by shorter text, then lexicographically.
  const scored = valid.map(scoreCandidate);
  scored.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    for (let i = 0; i < a.criteria.length; i++) {
      if (b.criteria[i] !== a.criteria[i]) return b.criteria[i] - a.criteria[i];
    }
    if (a.text.length !== b.text.length) return a.text.length - b.text.length;
    return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
  });

  for (const s of scored) {
    console.log(
      `${s.total.toFixed(2)}  [${s.criteria.map((c) => c.toFixed(2)).join(" ")}]  (${[...s.text].length} chars) ${s.text}`,
    );
  }

  const winner = scored[0];
  console.log(`\nwinner (${[...winner.text].length} chars): ${winner.text}`);

  // 3. Write the winner, with no trailing newline: the file holds exactly
  //    the one-line label, nothing else.
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "entry.txt");
  writeFileSync(outPath, winner.text, "utf8");

  // 4. Read it back and verify byte-for-byte against every gate.
  const back = readFileSync(outPath, "utf8");
  const backBytes = readFileSync(outPath);
  if (back !== winner.text) {
    console.error("read-back text differs from winner");
    process.exit(1);
  }
  if (!backBytes.equals(Buffer.from(winner.text, "utf8"))) {
    console.error("read-back bytes differ from winner");
    process.exit(1);
  }
  const problems = gateProblems(back);
  if (problems.length > 0) {
    console.error(`gate failed on written file: ${problems.join("; ")}`);
    process.exit(1);
  }

  console.log(`wrote and verified ${outPath} (${backBytes.length} bytes)`);
}

main();
