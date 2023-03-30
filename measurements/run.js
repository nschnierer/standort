const yargs = require("yargs");
const fs = require("fs/promises");
const path = require("path");
const { runLCPMetrics } = require("./lcpMetrics.js");
const { runStandortMetrics } = require("./standortMetrics.js");

const options = yargs
  .option("lcp-url", {
    description: "The URL to measure LCP for",
    type: "string",
  })
  .option("lcp-iterations", {
    description: "The number of times to measure LCP for the given URL",
    type: "number",
    default: 3,
  })
  .option("standort-url", {
    description: "The URL to measure the performance of the Standort app",
    type: "string",
  })
  .option("standort-clients-number", {
    description: "The number of clients to simulate",
    type: "number",
    default: 8,
  }).argv;

const cleanAndCreateOutputDir = async (dir) => {
  try {
    await fs.rm(dir, { recursive: true });
  } catch (error) {
    // ignore
  }
  await fs.mkdir(dir);
};

(async () => {
  const outputPath = path.join(process.cwd(), "measurements", "output");
  await cleanAndCreateOutputDir(outputPath);

  if (options["lcp-url"]) {
    const url = new URL(options["lcp-url"]);
    await runLCPMetrics({
      url: url.toString(),
      iterations: options["lcp-iterations"],
      outputPath,
    });
  }

  if (options["standort-url"]) {
    const url = new URL(options["standort-url"]);
    await runStandortMetrics({
      url: url.toString(),
      clientsNumber: options["standort-clients-number"],
      outputPath,
    });
  }
})();
