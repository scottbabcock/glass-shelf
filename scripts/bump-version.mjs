// Set the plugin version in package.json and plugin.json. Usage: pnpm bump 0.2.0  (or 0.2.0-beta.1)
import { readFileSync, writeFileSync } from 'node:fs';

const version = process.argv[2]?.replace(/^v/, '');
if (!version || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
    console.error('Usage: pnpm bump <major.minor.patch[-prerelease]>   e.g. pnpm bump 0.2.0');
    process.exit(1);
}

for (const file of ['package.json', 'plugin.json']) {
    const text = readFileSync(file, 'utf8');
    const next = text.replace(/("version"\s*:\s*")[^"]*(")/, `$1${version}$2`);
    if (next === text && !text.includes(`"version": "${version}"`)) {
        console.error(`No "version" field found in ${file}`);
        process.exit(1);
    }
    writeFileSync(file, next);
    console.log(`${file} -> ${version}`);
}

console.log(`\nNext: commit, then tag and push:
  git commit -am "chore(release): v${version}"
  git tag v${version}
  git push origin HEAD v${version}`);
