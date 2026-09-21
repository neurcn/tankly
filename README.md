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
of the screens and the order of the sections in the Slack message.** To change
the route, move the blocks up or down.

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
- You can add `start: 600` to make the slider open at a particular value.
  Without it, the slider opens halfway up.

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
screen, and no Storage line at all.

The message lists only the counts above zero, N2 before CO2 and full before
empty, matching the order of `CONFIG.storageItems`. If every count is zero the
line reads `Storage: none`.

### Other settings

| Setting | What it does |
| --- | --- |
| `psiStep` | How far a psi slider jumps as you drag it. Default 50. |
| `psiFineStep` | The two small buttons under a psi slider. Default 10. |
| `pctStep`, `pctFineStep` | The same two things for the LN2 percent slider. |
| `storageItems` | The four counter rows and how they are worded in the message. |
| `ph` | The wording of the pH probe screen and its line in the message. |
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
*Tank Update (9/21)*

*Secondary (3326)*
Running: N2 2700 psi | CO2 850 psi | CO2 700 psi
Storage: 1 N2 (full), 1 CO2 (full), 1 CO2 (empty)

*Primary (3343)*
Running: CO2 850 psi | CO2 850 psi
Storage: 1 CO2 (empty)

*911 Room (3346)*
Running: CO2 1500 psi | N2 2400 psi
Storage: none

*iPSC Room (2308)*
Running: CO2 750 psi | CO2 900 psi

*LN2*
Level: 27%

*pH Probe*
Calibrated and stored correctly :white_check_mark:
```

Single asterisks are Slack's bold, so the room names come out bold when pasted.
