# Tank Check

A one page web app for the lab's every-other-day gas tank round. You walk the
building in the usual order, set each reading with a big thumb slider, and the
app hands you a finished Slack message with a Copy button.

Open it on your phone, tap **Start check**, and work through the screens. Answers
are saved as you go, so if the phone locks or you switch apps you can pick the
check back up where you left it.

**Live app:** https://neurcn.github.io/tank-check/

## Add it to your home screen

- **iPhone (Safari):** open the link, tap the Share button, then *Add to Home Screen*.
- **Android (Chrome):** open the link, tap the three dot menu, then *Add to Home screen*.

It then opens full screen with no browser chrome, like a normal app.

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

The room name arrives in Slack bold. The box on the output screen shows
exactly how the message will look once pasted.

Flag it again to edit the note or remove the flag. Two flags in the same room
give two lines, in the order you walked them.

The app also offers a flag by itself when a reading looks bad. Confirm a tank
at 0 psi and it asks *"Create an alert for empty CO2?"*. Say yes and the note
sheet opens with **Empty CO2** already filled in, and you confirm it the same
way as one you raised yourself. The same happens on a storage screen when a gas
has no full cylinders left but empties are sitting there, and on the LN screen
at 0 percent. The app only ever suggests, it never flags anything on its own,
and it asks whether or not you already flagged that screen, so it never assumes
you have covered it.

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
to get wrong. Blank lines between sections are ordinary blank lines, which
paste through untouched.

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

## Changing the rooms, tanks or route

Everything you would want to change lives in one `CONFIG` object at the top of
the `<script>` block in `index.html`. Open the file, scroll to the big
`CONFIG` comment, and edit. Stop when you reach the line that says
`END OF CONFIG`; nothing below it needs to change.

`CONFIG.route` is the walk, top to bottom. **The order of this list is the order
of the screens.** To change the route, move the blocks up or down.

### Add a tank to a room

Add one line to that room's `tanks` list:

```js
tanks: [
  { label: "CO2 Tank 1", gas: "CO2", min: 0, max: 1200 },
  { label: "CO2 Tank 2", gas: "CO2", min: 0, max: 1200 },
  { label: "CO2 Tank 3", gas: "CO2", min: 0, max: 1200 }   // new
]
```

- `label` is what the screen calls the tank.
- `gas` is what the Slack message calls it, so `CO2 850 psi`.
- `min` and `max` are the ends of the slider, in psi.
- `start: 600` makes the slider open at a particular value. Without it, the
  slider opens halfway up.
- `alertAtOrBelow: 200` makes that one tank offer an alert at 200 psi instead
  of waiting for 0. See `CONFIG.alertAtOrBelow` for the setting every tank uses
  by default.

### Remove a tank

Delete its line. That is all.

### Add a room

Copy a whole room block and edit the four fields:

```js
{
  type: "room",
  name: "Tissue Culture",
  number: "3350",
  storage: false,          // true adds the storage counting screen
  tanks: [
    { label: "CO2 Tank 1", gas: "CO2", min: 0, max: 1200 }
  ]
},
```

Put it in the list where you actually walk past it.

### Storage lines

A room with `storage: true` gets a counting screen after its tanks, and a
`Storage:` line in the message. A room with `storage: false` gets neither: no
screen, and no Storage line at all. Right now only Secondary and Primary have
storage.

The message lists only the counts above zero, N2 before CO2 and full before
empty, matching the order of `CONFIG.storageItems`. If every count is zero the
line reads `Storage: none`.

### The pH probe

The last screen has two buttons, because the message says which one happened:

| Button | Line in the message |
| --- | --- |
| Already calibrated | `Calibrated and stored correctly` |
| I recalibrated it today | `Recalibrated today, stored correctly` |

Both are under `CONFIG.ph`, along with the wording of the prompt.

### Other settings

| Setting | What it does |
| --- | --- |
| `psiStep` | How far a psi slider jumps as you drag it. Default 50. |
| `psiFineStep` | The two small buttons under a psi slider. Default 10. |
| `pctStep`, `pctFineStep` | The same two things for the LN percent slider. |
| `alertAtOrBelow` | A tank at or below this reading offers an alert when you confirm it. Default 0, meaning only a completely empty tank. |
| `storageItems` | The four counter rows and how they are worded in the message. |
| `attention` | The wording of the flag sheet, the two automatic prompts, and the `ATTENTION` line. |
| `copyStyle` | How Copy puts the message on the clipboard. See the Copy section above. |
| `ph` | The two pH probe buttons and their lines. |
| `messageOrder` | The order of the sections in the message, which is not the order you walk them. Rooms first, then LN, then the probe. Set it to `[]` to make the message follow the walk. |
| `messageTitle` | The first line of the message, before the date. |
| `hapticMs` | Length of the buzz when a slider crosses a snap point. `0` turns it off. Android only; iPhone ignores it. |

### After you edit

Changing `CONFIG` changes the route fingerprint the app stores alongside a
saved session, so any half-finished check on someone's phone is dropped rather
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
Tank Update (9/21)

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

LN
Level: 27%

pH Probe
Calibrated and stored correctly
```

Every line that names a room or a section arrives bold.
