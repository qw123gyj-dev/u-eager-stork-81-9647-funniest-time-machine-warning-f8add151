[![make.fun](https://make.fun/badge/u-eager-stork-81-9647-funniest-time-machine-warning-f8add151.svg)](https://make.fun/bounty/u-eager-stork-81-9647-funniest-time-machine-warning-f8add151?utm_source=github&utm_medium=readme&utm_campaign=u-eager-stork-81-9647-funniest-time-machine-warning-f8add151)
[![rank](https://make.fun/badge/u-eager-stork-81-9647-funniest-time-machine-warning-f8add151/qw123gyj-dev/u-eager-stork-81-9647-funniest-time-machine-warning-f8add151/rank.svg)](https://make.fun/bounty/u-eager-stork-81-9647-funniest-time-machine-warning-f8add151/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-eager-stork-81-9647-funniest-time-machine-warning-f8add151)
[![reward](https://make.fun/badge/u-eager-stork-81-9647-funniest-time-machine-warning-f8add151/qw123gyj-dev/u-eager-stork-81-9647-funniest-time-machine-warning-f8add151/reward.svg)](https://make.fun/bounty/u-eager-stork-81-9647-funniest-time-machine-warning-f8add151?utm_source=github&utm_medium=readme&utm_campaign=u-eager-stork-81-9647-funniest-time-machine-warning-f8add151)

# Funniest Time Machine Warning Label

A deterministic entry picker for the make.fun bounty "Funniest Time Machine Warning Label". `main.ts` scores 14 hand-written candidate one-liners against the judge's brief — in the brief's own order: a genuine time-machine warning label, a real hazard of time travel turned into the joke, the surprise saved for the last few words, a straight-faced safety-notice register, and no wasted words — then writes the winning label to `$MAKEFUN_OUTPUT_DIR/entry.txt` (fallback `/output/entry.txt`), reads it back, and verifies it byte-for-byte against every gate (1–120 characters, single line, valid UTF-8, not only whitespace). The scorer is sharpened beyond a flat lexicon match: a label that only names hazards without turning one into a consequence is capped, the shopworn "kill your grandfather" gag is docked for predictability, the twist must land inside the last six words, and ties break criterion by criterion in the brief's order before falling back to shorter length.

The winning label:

> WARNING: Do not attempt to prevent your own birth. Refunds are not issued to nonexistent customers.

It turns the grandfather paradox into the joke, keeps a deadpan official tone, and lands the punchline — nonexistent customers can't get refunds — in the final words.

## Run

Node 22, standard library only, no network:

```sh
MAKEFUN_OUTPUT_DIR=/tmp/time-machine-out node main.ts
cat /tmp/time-machine-out/entry.txt
```
