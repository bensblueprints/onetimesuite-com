/* build-drive.js — assemble the sellable USB payload.
 *
 * Produces a self-contained folder you can copy onto a flash drive, image, and
 * duplicate. Real file copies, never hard links: links do not survive crossing
 * to another volume, and a drive full of dangling links is a returned product.
 *
 *   node scripts/build-drive.js --out E:\            # straight onto the stick
 *   node scripts/build-drive.js --out "D:\drive-master" --source
 *   node scripts/build-drive.js --out E:\ --no-installers   # docs + code only
 *
 * Flags:
 *   --out <dir>        destination (required)
 *   --source           include Web Apps source (node_modules always excluded)
 *   --no-installers    skip the .exe payload
 *   --dry              report the plan and the size, copy nothing
 */

const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..');
const SUITE = path.resolve(REPO, '..', '..');
const WIN = path.join(SUITE, 'Windows Installers');
const MAC = path.join(SUITE, 'Mac Installers');
const WEB = path.join(SUITE, 'Web Apps');
const INSTALL_FOLDER = path.join(SUITE, 'Desktop Apps — Install All');

const args = process.argv.slice(2);
const argOf = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const OUT = argOf('--out');
const WITH_SOURCE = args.includes('--source');
const NO_INSTALLERS = args.includes('--no-installers');
const DRY = args.includes('--dry');

if (!OUT) {
  console.error('need --out <dir>   e.g. node scripts/build-drive.js --out E:\\');
  process.exit(1);
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'release', 'build', '.vite', 'coverage']);

const gb = n => (n / 1024 / 1024 / 1024).toFixed(2);
const mb = n => Math.round(n / 1024 / 1024);

let copiedBytes = 0, copiedFiles = 0;

function copyTree(src, dest, { skip = SKIP_DIRS } = {}) {
  let entries;
  try { entries = fs.readdirSync(src, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.isDirectory() && skip.has(e.name)) continue;
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) {
      if (!DRY) fs.mkdirSync(d, { recursive: true });
      copyTree(s, d, { skip });
    } else {
      let st; try { st = fs.statSync(s); } catch { continue; }
      copiedBytes += st.size; copiedFiles++;
      if (!DRY) {
        fs.mkdirSync(path.dirname(d), { recursive: true });
        fs.copyFileSync(s, d);
      }
    }
  }
}

function copyFile(src, dest) {
  let st; try { st = fs.statSync(src); } catch { return false; }
  copiedBytes += st.size; copiedFiles++;
  if (!DRY) { fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(src, dest); }
  return true;
}

/* ---------------- plan ------------------------------------------------------ */

const root = path.join(OUT, 'OneTimeSuite');
if (!DRY) fs.mkdirSync(root, { recursive: true });

console.log(`building drive payload -> ${root}${DRY ? '  (DRY RUN)' : ''}\n`);

/* 1. Windows installers */
if (!NO_INSTALLERS) {
  const from = fs.existsSync(INSTALL_FOLDER) ? INSTALL_FOLDER : null;
  if (!from) {
    console.log('! "Desktop Apps — Install All" not found — run scripts/app-inventory.js first');
  } else {
    const exes = fs.readdirSync(from).filter(f => f.toLowerCase().endsWith('.exe'));
    console.log(`Windows installers : ${exes.length}`);
    for (const f of exes) copyFile(path.join(from, f), path.join(root, 'Windows', f));
  }

  /* 2. Mac installers */
  if (fs.existsSync(MAC)) {
    let n = 0;
    for (const app of fs.readdirSync(MAC, { withFileTypes: true }).filter(d => d.isDirectory())) {
      const dir = path.join(MAC, app.name);
      for (const f of fs.readdirSync(dir)) {
        if (!f.toLowerCase().endsWith('.dmg')) continue;
        copyFile(path.join(dir, f), path.join(root, 'Mac', app.name, f));
        n++;
      }
    }
    console.log(`Mac installers     : ${n}`);
  }
}

/* 3. Source */
if (WITH_SOURCE) {
  const apps = fs.existsSync(WEB) ? fs.readdirSync(WEB, { withFileTypes: true }).filter(d => d.isDirectory()) : [];
  console.log(`web app source     : ${apps.length} app(s) (node_modules excluded)`);
  for (const a of apps) copyTree(path.join(WEB, a.name), path.join(root, 'Source', a.name));
}

/* 4. Docs */
for (const doc of ['INSTALL-THESE.md', 'WEB-APPS.md']) {
  copyFile(path.join(INSTALL_FOLDER, doc), path.join(root, doc));
}

/* 5. START-HERE */
const startHere = `# OneTimeSuite — the whole catalog, on a stick

Everything on this drive is **bought, not rented**. There is no account to
create, no licence key to enter, no server to phone home to, and nothing
expires. Copy it off, install what you want, and the drive has done its job.

## What's here

    Windows/          every Windows installer — double-click, next, done
    Mac/              .dmg builds (Intel + Apple Silicon)
    Source/           full source for the self-hosted web apps
    INSTALL-THESE.md  every desktop app, what it replaces, what it costs
    WEB-APPS.md       every cloud app, with links and source repos

## Installing

**Windows** — open \`Windows\\\`, run any installer. They are ordinary NSIS
installers. Windows SmartScreen may warn on first run because these are not
code-signed; "More info" then "Run anyway".

**Mac** — open \`Mac/<App>/\` and run the .dmg that matches your chip. Right-click
the app and choose Open the first time, or Gatekeeper will refuse it.

**Self-hosted web apps** — each folder under \`Source/\` is a normal Node project:

    cd Source/<App>/code
    npm install
    npm start

## Backing it up

This drive is the master copy. Image it before you use it — see
\`CLONING.md\` for how to duplicate the whole stick.

---

The software is always a one-time purchase. The cloud is the only upgrade, and
only if you'd rather not run the server yourself.
`;
if (!DRY) fs.writeFileSync(path.join(root, 'START-HERE.md'), startHere, 'utf8');

/* 6. Cloning guide */
const cloning = `# Cloning this drive

To sell copies you want a **byte-for-byte image** of the master stick, then
write that image to each new one. Copying files instead of imaging loses the
partition layout and the boot/autorun behaviour.

## Windows — ImageUSB (free, purpose-built for exactly this)

https://www.osforensics.com/tools/write-usb-images.html

1. Plug in the master drive.
2. ImageUSB -> **Create image from USB drive** -> save as \`onetimesuite.bin\`.
3. Plug in a blank drive (same size or larger).
4. ImageUSB -> **Write image to USB drive** -> pick \`onetimesuite.bin\`.
5. It can write to **several drives at once** — select them all. That is the
   feature that makes small-batch duplication practical.

## Windows — Rufus (if you want it bootable)

https://rufus.ie/

Only needed if the drive should boot into something. For a data drive of
installers, ImageUSB is the simpler tool.

## Mac / Linux — dd

    # read the master (find the disk id with: diskutil list)
    sudo dd if=/dev/rdisk3 of=onetimesuite.img bs=4m

    # write to a new drive
    sudo dd if=onetimesuite.img of=/dev/rdisk4 bs=4m

## Practical notes for selling these

- **Buy drives one size up.** A "32 GB" stick from different suppliers is not
  the same byte count, and an image only writes to a drive at least as large as
  the source. Image a 32 GB master onto 64 GB sticks and you never get bitten.
- **Format the master exFAT**, not FAT32: FAT32 caps a single file at 4 GB and
  refuses to hold the larger installers. exFAT reads on both Windows and macOS.
- **Set a volume label** (\`OneTimeSuite\`) before imaging — it shows up as the
  drive name on the buyer's machine and it is free branding.
- **Verify one drive per batch** by actually installing two or three apps from
  it. An image that writes without error can still be a bad flash.
- **Write-protect if your drives support it.** Some USB controllers expose a
  read-only switch; it stops a buyer wiping the drive and asking for a refund.
- Include \`START-HERE.md\` at the root — it is the first thing they open.

## What this drive is worth

The à-la-carte value of the apps on it is in \`INSTALL-THESE.md\`. The bundle
sells for $997 online. A physical drive is a different product to a download:
it needs no account, no internet, and it works in ten years when the site is
gone. Price it accordingly.
`;
if (!DRY) fs.writeFileSync(path.join(root, 'CLONING.md'), cloning, 'utf8');

console.log(`\nfiles : ${copiedFiles}`);
console.log(`size  : ${gb(copiedBytes)} GB (${mb(copiedBytes)} MB)`);
console.log(`out   : ${root}`);
if (DRY) console.log('\nDRY RUN — nothing was written. Drop --dry to build it.');
else console.log('\nNext: format the stick exFAT, label it OneTimeSuite, copy this folder to its root,\nthen follow CLONING.md to image and duplicate.');
