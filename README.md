# Tankly

A one page web app for the lab's gas tank rounds. Open the six room menu, tap
whichever room you are standing in, set each reading with a big thumb slider,
and the app hands you a finished Slack message with a Copy button.

There is no fixed order. Walk the building however you like and tap rooms as
you reach them; the Slack message always comes out in the same order anyway.
Answers are saved as you go, so if the phone locks or you switch apps you can
pick the check back up where you left it. A check belongs to the day it was
walked: come back the next day and you start clean.

**Live app:** https://neurcn.github.io/tankly/

## Add it to your home screen

- **iPhone (Safari):** open the link, tap the Share button, then *Add to Home Screen*.
- **Android (Chrome):** open the link, tap the three dot menu, then *Add to Home screen*.

It then opens full screen with no browser chrome, like a normal app.

## The room menu

Six buttons, laid out roughly the way the rooms sit in the building:

| | | |
| --- | --- | --- |
| 911 | Secondary | iPSC |
| Primary | LN | pH |

Each button carries its room number and how many running tanks of each gas
are in it, so `CO₂ 2` and `N₂ 1`. Cylinders in storage are not counted there.
A room gets a green check once every screen in it is confirmed, and you can
tap a finished room again to fix a reading. iPSC is marked **Floor 2**.

**Build Slack message stays blocked until all six rooms are checked**, so the
message can never report a number nobody read.

## Flagging something that needs attention

Every screen has a ⚠ button in the top right corner. Tap it to mark that the
tank, the storage, the LN or the probe needs attention. You can type a short
note or just confirm without one. A flagged screen adds a line under its own
room in the message and puts a warning emoji beside the room name:

```
Secondary (3326) ⚠️
Running: N2 0 psi | CO2 850 psi | CO2 700 psi
Storage: 1 N2 (empty), 2 CO2 (empty)
ATTENTION: Empty N2
ATTENTION: No full CO2 in storage
```

Flag it again to edit the note or remove the flag. Two flags in the same room
give two lines.

The app also offers a flag by itself when a reading looks bad, and it only
ever offers: it never flags anything on its own, and it asks whether or not
you already flagged that screen.

| When | What it offers |
| --- | --- |
| A tank confirmed at 0 psi | `Empty CO2` or `Empty N2` |
| LN at 0% | `Empty LN` |
| LN from 1 to 9% | `LN <10%` |
| LN at exactly 10% | `LN at 10%` |
| A storage room with no full cylinders of a gas left, but empties sitting there | `No full N2 in storage` |

## The circled i

Some screens carry a note behind a circled **i** next to the warning button.
Tapping it drops a bubble under the button. Every N₂ tank has one, reminding
you that a tank reading 0 may just need its top valve opened briefly.

The i only appears on screens that have a note, so it is never an empty
button.

## The pH probe

Calibration is a weekly job, not a daily one, so the probe room works
differently from the rest.

The **first time the probe room is opened in a given week**, it asks two
things: check the calibration, then confirm how the probe is stored. Either
answer to the first question settles calibration for the week:

| Button | Line in the message |
| --- | --- |
| It was already calibrated | `Calibration checked and good, stored correctly` |
| I calibrated it today | `Recalibrated today, stored correctly` |

**Every visit after that in the same week** asks only whether the probe is
stored correctly, and the message says `Stored correctly`. There is a quiet
*I recalibrated it today* on that screen for anyone who does it anyway.

The week runs Monday to Sunday. It is remembered on that phone alone, because
a page served from GitHub has no server to share anything through. Somebody
walking the round on a different phone is asked to **check** the calibration,
not to redo it, which takes a moment and is never a question about what
anyone else did. Confirming the storage screen is what settles the week, so
backing out half way leaves the calibration still to do.

## How Copy works, and why there are no asterisks

Slack only turns `*asterisks*` into bold, and `:warning:` into an emoji, while
you are **typing** them in the composer. Text that is **pasted** is taken
literally, so a message written in that style pastes onto a phone with the
asterisks and the colons still showing.

Sending real formatting instead did not work either. Slack on a phone reads
pasted formatting into its own format and got it wrong both ways we tried it:
with a blank line between sections it ran the first heading's bold through the
entire message, and without one it threw the blank lines away.

So the app sends no markup and no formatting at all. The room names are
written with bold letterforms, which are bold characters in their own right,
and the warning sign is the real character rather than the `:warning:`
shortcode. There is nothing for Slack to interpret, so there is nothing for it
to get wrong.

The one real cost: **a Slack search for "Primary" will not match a heading**,
because those bold letters are different characters from ordinary ones. Every
other line, including the readings and any ATTENTION notes, is ordinary text
and stays searchable.

`CONFIG.copyStyle` picks between the approaches:

| `copyStyle` | What Copy puts on the clipboard |
| --- | --- |
| `"unicode"` (default) | Plain text with bold letterforms. The only one that survived Slack on a phone intact. |
| `"rich"` | Real formatting alongside plain text. The better answer anywhere that handles it properly, and wrong in Slack on a phone. |
| `"clean"` | Plain text, no bold at all. Renders correctly everywhere and stays fully searchable. Use this if the bold letters ever show as boxes on somebody's phone. |
| `"markup"` | The old `*asterisk*` and `:warning:` style, for typing by hand. |

## The files

| File | What it is |
| --- | --- |
| `index.html` | The whole app. HTML, CSS and JavaScript in one file, no build step, no dependencies. |
| `manifest.webmanifest` | Makes it installable to a phone home screen. |
| `icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | The home screen icon. |
| `make-icons.py` | Redraws the three PNG icons. Only needed if you want to change how the icon looks: `python3 make-icons.py`, no dependencies. Keep it in step with `icon.svg`, which is the same drawing by hand. |

## Changing the rooms, tanks or route

Everything you would want to change lives in one `CONFIG` object at the top of
the `<script>` block in `index.html`. Open the file, scroll to the big
`CONFIG` comment, and edit. Stop when you reach the line that says
`END OF CONFIG`; nothing below it needs to change.

Two orders matter and they are **not** the same one:

- **The order of `CONFIG.route`** is the order the rooms appear in the Slack
  message.
- **The `menu` number on each room**, 1 to 6, is which button it is on the
  menu, counted left to right along the top row and then the bottom row.

So you can rearrange the menu without touching the message, or the other way
round.

### Add a tank to a room

Add one line to that room's `tanks` list:

```js
tanks: [
  { label: "CO2 Tank 1", gas: "CO2", min: 0, max: 1200,
    prompt: "Record the psi for CO₂ Tank 1." },
  { label: "CO2 Tank 2", gas: "CO2", min: 0, max: 1200,
    prompt: "Record the psi for CO₂ Tank 2." },
  { label: "CO2 Tank 3", gas: "CO2", min: 0, max: 1200,      // new
    prompt: "Record the psi for CO₂ Tank 3." }
]
```

- `label` keeps this tank's reading apart from the others.
- `gas` is what the Slack message calls it, and decides which count it adds to
  on the menu button.
- `min` and `max` are the ends of the slider, in psi.
- `prompt` is the sentence at the top of its screen. Write `N₂` and `CO₂` with
  the real subscript characters; they are ordinary text and paste anywhere.
- `info` adds a note behind the circled i on that one screen. Put text between
  `_underscores_` to underline it.
- `start: 600` makes the slider open at a particular value instead of halfway.
- `alertAtOrBelow: 200` makes that one tank offer an alert at 200 psi instead
  of waiting for 0.

### Remove a tank

Delete its lines. That is all.

### Add a room

Copy a whole room block, edit the fields, and give it a `menu` number. Bear in
mind the menu is built for six buttons in two rows of three; a seventh will
still work but the rows will get crowded.

### Storage lines

A room with `storage: true` gets a counting screen after its tanks, and a
`Storage:` line in the message. A room with `storage: false` gets neither: no
screen, and no Storage line at all. Only Secondary and Primary have storage.

The message lists only the counts above zero, N2 before CO2 and full before
empty, matching the order of `CONFIG.storageItems`. If every count is zero the
line reads `Storage: none`.

### Other settings

| Setting | What it does |
| --- | --- |
| `appTitle`, `appUrl` | The name on the menu and the link on the last line of the message. |
| `menuHint` | The line under the title on the room menu. |
| `footerText` | The second to last line of the message. |
| `infoByGas` | The circled i note shown on every tank of a gas, unless that tank has its own `info`. |
| `tileGases` | Which gases are counted on a menu button, and how they are written there. |
| `psiStep` | How far a psi slider jumps as you drag it. Default 50. |
| `psiFineStep` | The two small buttons under a psi slider. Default 10. |
| `pctStep`, `pctFineStep` | The same two things for the LN percent slider. |
| `storagePrompt` | The sentence at the top of a counting screen. |
| `alertAtOrBelow` | A tank at or below this reading offers an alert. Default 0, meaning only a completely empty tank. A stop can replace it outright with `alerts` bands, the way LN does. |
| `storageItems` | The four counter rows and how they are worded in the message. |
| `ph` | Every word on the two probe screens and the three lines they can produce. |
| `attention` | The wording of the flag sheet, the automatic prompts, and the `ATTENTION` line. |
| `messageOrder` | The order of the sections in the message by stop type. Rooms first, then LN, then the probe. |
| `messageTitle` | The first line of the message, before the date. |
| `copyStyle` | How Copy puts the message on the clipboard. See the Copy section above. |
| `hapticMs` | Length of the buzz when a slider crosses a snap point. `0` turns it off. Android only; iPhone ignores it. |

### After you edit

Changing `CONFIG` changes the route fingerprint the app stores alongside a
saved check, so any half finished check on someone's phone is dropped rather
than restored onto the wrong screens. Nobody has to clear anything by hand.

To test an edit before publishing it, open `index.html` from your computer in
any browser. Everything runs locally.

## Publishing a change

The app is served by GitHub Pages from the `main` branch.

```bash
git add index.html
git commit -m "Add CO2 Tank 3 to Primary"
git push
```

Give it a minute, then reload the page on your phone. If you added it to your
home screen, pull down on the page to force a refresh.

## The message it produces

```
Tank Update (9/23)

Secondary (3326)
Running: N2 2700 psi | CO2 850 psi | CO2 700 psi
Storage: 1 N2 (full), 1 CO2 (full), 1 CO2 (empty)

Primary (3343)
Running: CO2 850 psi | CO2 850 psi
Storage: 1 CO2 (empty)

911 Room (3346)
Running: CO2 1500 psi | N2 2400 psi

iPSC Room (2308)
Running: CO2 750 psi | CO2 900 psi

LN ⚠️
Level: 10%
ATTENTION: LN at 10%

pH Probe
Calibration checked and good, stored correctly

Streamlined with Tankly
https://neurcn.github.io/tankly/
```

Every line that names a room or a section arrives bold.
