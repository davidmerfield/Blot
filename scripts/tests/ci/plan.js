// Turns node.yml's TEST_SUITES list into the test job matrix: a few runners,
// each running several lanes in parallel (scripts/tests/ci/run-lanes.sh), each
// lane a sequence of suite shards. Shards are packed longest first onto the
// least loaded lane (by the seconds in timings.json), so lanes finish at about
// the same time, then the lanes are dealt out to the runners.
//
// Usage: TEST_SUITES=... node scripts/tests/ci/plan.js --runners=4 --lanes=4
// Prints the matrix JSON ({ include: [{ runner, name, lanes }] }) on stdout and
// the plan on stderr. With --suites, prints the distinct suite paths instead
// (a JSON array), for node.yml's check that every spec file is run.
//
// TEST_SUITES format, one per line: "<path>[|<exclude>,<exclude>...][:<shards>]".
// timings.json maps "<path>[|<exclude>...]" to the seconds the whole suite
// takes (all shards together); a suite missing from it counts as DEFAULT.

const timings = require("./timings.json");

const DEFAULT = 60;

function parseArgs(argv) {
  const flags = {};
  for (const arg of argv) {
    const m = /^--([^=]+)=(.*)$/.exec(arg);
    if (m) flags[m[1]] = m[2];
  }
  return flags;
}

function parseSuites(text) {
  const units = [];
  for (const raw of text.split("\n")) {
    const line = raw.replace(/^\s*-?\s*/, "").trim();
    if (!line) continue;
    const [key, shardsText] = line.split(":");
    const shards = /^\d+$/.test(shardsText || "") ? parseInt(shardsText, 10) : 1;
    const [suite, ...excludes] = key.split("|");
    const seconds = timings[key] !== undefined ? timings[key] : DEFAULT;
    for (let i = 1; i <= shards; i++) {
      units.push({
        suite,
        exclude: excludes.join(","),
        shard: `${i}/${shards}`,
        seconds: Math.round(seconds / shards),
      });
    }
  }
  return units;
}

function plan(units, runners, lanesPerRunner) {
  const lanes = Array.from({ length: runners * lanesPerRunner }, () => ({
    seconds: 0,
    units: [],
  }));

  units
    .slice()
    .sort((a, b) => b.seconds - a.seconds)
    .forEach((unit) => {
      const lane = lanes.reduce((min, l) => (l.seconds < min.seconds ? l : min));
      lane.units.push(unit);
      lane.seconds += unit.seconds;
    });

  // Deal the lanes out longest first, snaking across the runners, so no
  // runner gets all the long ones.
  const byRunner = Array.from({ length: runners }, () => []);
  lanes
    .filter((l) => l.units.length)
    .sort((a, b) => b.seconds - a.seconds)
    .forEach((lane, i) => {
      const round = Math.floor(i / runners);
      const r = round % 2 === 0 ? i % runners : runners - 1 - (i % runners);
      byRunner[r].push(lane);
    });

  return byRunner
    .filter((r) => r.length)
    .map((runnerLanes, i, all) => ({
      runner: `${i + 1}/${all.length}`,
      // Shown in the job name so a failing job says what it ran
      name: runnerLanes
        .map((l) => l.units.map((u) => shortName(u)).join("+"))
        .join(", "),
      lanes: runnerLanes.map((l) =>
        l.units.map(({ suite, exclude, shard }) => ({ suite, exclude, shard }))
      ),
      seconds: Math.max(...runnerLanes.map((l) => l.seconds)),
    }));
}

function shortName(unit) {
  const name = unit.suite.replace(/^app\//, "");
  return unit.shard === "1/1" ? name : `${name} ${unit.shard}`;
}

if (require.main === module) {
  const flags = parseArgs(process.argv.slice(2));
  if (process.argv.includes("--suites")) flags.suites = true;
  const runners = parseInt(flags.runners || "4", 10);
  const lanes = parseInt(flags.lanes || "4", 10);
  const units = parseSuites(process.env.TEST_SUITES || "");
  if (!units.length) throw new Error("TEST_SUITES is empty");

  if (flags.suites) {
    console.log(JSON.stringify([...new Set(units.map((u) => u.suite))].sort()));
    process.exit(0);
  }

  const include = plan(units, runners, lanes);
  for (const r of include) {
    console.error(`runner ${r.runner} (~${r.seconds}s):`);
    r.lanes.forEach((lane, i) =>
      console.error(
        `  lane ${i + 1}: ` +
          lane.map((u) => shortName(u)).join(", ")
      )
    );
  }
  console.log(
    JSON.stringify({ include: include.map(({ seconds, ...r }) => r) })
  );
}

module.exports = { parseSuites, plan };
