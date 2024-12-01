// um db scary
const fs = require("fs");
let ships = JSON.parse(fs.readFileSync("ships.json")).filter((m) => !m.subtype);
// ships = ships.slice(0,2)
const final = [];
const unescapeHTML = (str) => {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};
let skipped = [];
const oldShips = JSON.parse(fs.readFileSync("old-parsed-ships.json"));
// ships = ships.filter((ship) => !oldShips.find((s) => s.repo === ship.repo));
for (const ship of ships) {
  // console.log(ship.blocks)
  // lets extract the data :3
  try {
    const text = unescapeHTML(ship.blocks[0].text.text).replaceAll("%7C", "");
    // console.log(text, ship.blocks[0].text.text)
    let userId = text.match(/By <@(.*)>/)[1].split(">")[0];
    let repo = text.match(/<([^|>]+)\|Repo>/)[1];
    let demo = text.match(/<([^|>]+)\|Demo>/)[1];
    let hourCount = parseInt(text.match(/Made in (\d+)\s*hours?/)[1]);
    console.log(userId, repo, demo, hourCount);
    final.push({
      userId,
      repo,
      demo,
      hourCount,
    });
    console.log(`Added ${ship.blocks[0].text.text}`);
  } catch (e) {
    // subject to manual review
    skipped.push(ship);
    console.log(`Skipped ${ship.blocks[0].text.text}`);
  }
}
async function main() {
  console.log(` Skipped ${skipped.length} ships, and added ${final.length}`);
  // console.log(final)
  for (const skipper of skipped) {
    // prompt user for the data manually
    let repo, demo, hourCount, userId;
    // try all things separately so if there is one then yay otherwise find it
    try {
      repo = skipper.blocks[0].text.text.match(/<([^|>]+)\|Repo>/)[1];
    } catch (e) {}
    try {
      demo = skipper.blocks[0].text.text.match(/<([^|>]+)\|Demo>/)[1];
    } catch (e) {}
    try {
      hourCount = skipper.blocks[0].text.text.match(
        /Made in (\d+)\s*hours?/,
      )[1];
    } catch (e) {}
    try {
      userId = skipper.blocks[0].text.text.match(/By <@(.*)>/)[1].split(">")[0];
    } catch (e) {}

    console.log(skipper.blocks[0].text.text);
    if (!repo) {
      console.log(`Repo: `);
      repo = await new Promise((resolve) =>
        process.stdin.once("data", (data) => resolve(data.toString().trim())),
      );
    }
    if (!demo) {
      console.log(`Demo: `);
      demo = await new Promise((resolve) =>
        process.stdin.once("data", (data) => resolve(data.toString().trim())),
      );
    }
    if (!hourCount) {
      console.log(`Hours: `);
      hourCount = await new Promise((resolve) =>
        process.stdin.once("data", (data) => resolve(data.toString().trim())),
      );
    }
    if (!userId) {
      console.log(`UserId: `);
      userId = await new Promise((resolve) =>
        process.stdin.once("data", (data) => resolve(data.toString().trim())),
      );
    }
    final.push({
      userId,
      repo,
      demo,
      hourCount,
    });
    console.log(`Added!`);
    console.log("\n\n=");
  }
  fs.writeFileSync(`parsed-ships.json`, JSON.stringify(final));
  console.log(`Written parsed-ships.json`);
  process.exit();
}
main();
