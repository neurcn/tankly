/**
 * Tankly's shared log.
 *
 * This is the whole backend. It lives in one Google Sheet, costs nothing,
 * and does exactly two things: write a check when somebody publishes one, and
 * hand back a summary when the app opens.
 *
 * The summary is what makes "last: 850 psi on 9/21" possible on every phone
 * rather than only the one that took the reading, what lets the pH
 * calibration week be shared instead of remembered per phone, and what fills
 * in the roster and the tallies behind the Tank Checks line.
 *
 * A row is only written when somebody copies the message for Slack. Walking
 * a check and abandoning it leaves no trace, on purpose: this sheet is a
 * record of what was actually passed on, not of what was typed in.
 *
 * ---------------------------------------------------------------------------
 * PUTTING IT UP  (about five minutes, once)
 *
 *  1. Make a new Google Sheet and name it something like "Tankly log".
 *  2. Extensions  ->  Apps Script.
 *  3. Delete the myFunction stub, paste this whole file in, and save.
 *  4. Deploy  ->  New deployment.
 *  5. Click the gear beside "Select type" and choose  Web app.
 *  6. Execute as:      Me
 *     Who has access:  Anyone          <-- this exact option matters, see below
 *  7. Deploy, then authorise. Google will warn that the app is not verified,
 *     which is what it always says about a script you wrote yourself:
 *     Advanced  ->  Go to (your project name).
 *  8. Copy the Web app URL. It ends in /exec.
 *  9. Paste it into CONFIG.logUrl in index.html.
 *
 * "Anyone with a Google account" is NOT the same thing and will break it: the
 * browser gets sent to a sign in page instead of your data, and the request
 * fails with a CORS error that looks like a bug in the app.
 *
 * ---------------------------------------------------------------------------
 * CHANGING IT LATER
 *
 * Deploy -> Manage deployments -> the pencil -> Version: New version -> Deploy.
 * That keeps the same URL. Using "New deployment" instead mints a fresh URL
 * and quietly leaves the app talking to the old one.
 *
 * ---------------------------------------------------------------------------
 * WHO CAN WRITE TO THIS
 *
 * Anyone who has the URL, and the URL is in a public repository. There is no
 * way around that without making people sign in, which would defeat the point
 * of a phone in a hallway. What that buys an intruder is junk rows in a lab
 * spreadsheet, which you delete. No credentials and nothing personal pass
 * through here. The shape of every payload is checked below so a malformed
 * one is rejected rather than written.
 */

var SHEET_NAME = 'Checks';
var FIXED_COLUMNS = ['When', 'Who', 'Date', 'Week', 'pH', 'Flags', 'Message'];

/** Writes one check. */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json({ ok: false, error: 'empty request' });
    }
    var body = JSON.parse(e.postData.contents);
    if (!body || body.type !== 'check' || !Array.isArray(body.readings)) {
      return json({ ok: false, error: 'not a check' });
    }

    // A check carries its own id. If the app gave up waiting on a reply that
    // was actually on its way, it sends the same check again later, and this
    // is what stops that becoming two rows.
    if (body.id && alreadyWritten(body.id)) {
      return json({ ok: true, duplicate: true });
    }

    var sheet = getSheet();
    var header = readHeader(sheet);

    // every reading gets a column of its own, added the first time it appears
    body.readings.forEach(function (r) {
      if (r && r.label && header.indexOf(r.label) < 0) header.push(String(r.label));
    });
    writeHeader(sheet, header);

    var row = [];
    for (var i = 0; i < header.length; i++) row.push('');
    put(row, header, 'When',  body.at || new Date().toISOString());
    put(row, header, 'Who',   (body.user && body.user.name) || '');
    put(row, header, 'Date',  body.date || '');
    put(row, header, 'Week',  body.week || '');
    put(row, header, 'pH',    (body.ph && body.ph.outcome) || '');
    put(row, header, 'Flags', (body.flags || []).map(function (f) {
      return (f && f.note) ? f.note : 'ATTENTION';
    }).join(' | '));
    put(row, header, 'Message', body.message || '');

    body.readings.forEach(function (r) {
      if (!r || !r.label) return;
      var at = header.indexOf(r.label);
      if (at >= 0) row[at] = (r.value === undefined || r.value === null) ? '' : r.value;
    });

    sheet.appendRow(row);

    // the app reads this back, so keep it somewhere quick to fetch
    PropertiesService.getScriptProperties()
      .setProperty('last', JSON.stringify(body));
    if (body.id) rememberId(body.id);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/**
 * Hands back everything the app needs on opening: the most recent check, who
 * has published and how often, and how long the current run by one person is.
 *
 * Ranking is left to the app, which has to work out its own position with the
 * check it is about to publish counted in, and cannot do that from a rank
 * worked out before that check existed.
 */
function doGet() {
  try {
    var raw = PropertiesService.getScriptProperties().getProperty('last');
    var out = { ok: true, last: raw ? JSON.parse(raw) : null };

    var sheet = getSheet();
    var rows = sheet.getLastRow() - 1;              // the header is row 1
    if (rows > 0) {
      var header = readHeader(sheet);
      var whoAt = header.indexOf('Who');
      var whenAt = header.indexOf('When');
      var width = Math.max(whoAt, whenAt) + 1;
      var values = sheet.getRange(2, 1, rows, width).getValues();

      var counts = {}, seenAt = {}, order = [];
      var lastName = '', streak = 0;

      for (var i = 0; i < values.length; i++) {
        var name = whoAt >= 0 ? String(values[i][whoAt] || '').trim() : '';
        if (!name) continue;
        if (!counts[name]) { counts[name] = 0; order.push(name); }
        counts[name]++;
        seenAt[name] = whenAt >= 0 ? String(values[i][whenAt] || '') : '';
        // a run of one person's checks at the very end of the log
        if (name === lastName) streak++; else { lastName = name; streak = 1; }
      }

      out.users = order.map(function (name) {
        return { name: name, count: counts[name], lastAt: seenAt[name] };
      }).sort(function (a, b) {
        return a.lastAt < b.lastAt ? 1 : (a.lastAt > b.lastAt ? -1 : 0);
      });
      out.lastBy = lastName;
      out.lastStreak = streak;
    } else {
      out.users = [];
      out.lastBy = '';
      out.lastStreak = 0;
    }
    return json(out);
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/** Drops a value into the column of that name, if the column exists. */
function put(row, header, name, value) {
  var at = header.indexOf(name);
  if (at >= 0) row[at] = value;
}

/** The ids of recent checks, so a resend is recognised and dropped. */
function alreadyWritten(id) {
  var raw = PropertiesService.getScriptProperties().getProperty('ids');
  if (!raw) return false;
  try { return JSON.parse(raw).indexOf(id) >= 0; } catch (e) { return false; }
}

function rememberId(id) {
  var props = PropertiesService.getScriptProperties();
  var ids = [];
  try { ids = JSON.parse(props.getProperty('ids') || '[]'); } catch (e) { ids = []; }
  ids.push(id);
  while (ids.length > 50) ids.shift();       // only recent ones can be resends
  props.setProperty('ids', JSON.stringify(ids));
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}

function readHeader(sheet) {
  if (sheet.getLastRow() < 1 || sheet.getLastColumn() < 1) return FIXED_COLUMNS.slice();
  var row = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var out = [];
  for (var i = 0; i < row.length; i++) {
    if (row[i] !== '' && row[i] !== null) out.push(String(row[i]));
  }
  return out.length ? out : FIXED_COLUMNS.slice();
}

function writeHeader(sheet, header) {
  sheet.getRange(1, 1, 1, header.length).setValues([header]);
  sheet.setFrozenRows(1);
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
