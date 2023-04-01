// Description: Calculates the Largest Contentful Paint (LCP) of a given URL.
//
// Mainly inspired by https://gist.github.com/addyosmani/c053f68aead473d7585b45c9e8dce31e

const fs = require("fs/promises");
const path = require("path");
const puppeteer = require("puppeteer");
const { KnownDevices } = require("puppeteer");

const LOG_PREFIX = "[LCP Metrics]";

const networkProfiles = {
  "3G": {
    download: (2 * 1024 * 1024) / 8, // 2 Mbps
    upload: (250 * 1024) / 8, // 250 Kbps
    latency: 100, // 100 ms
  },
  HSPA: {
    download: (30 * 1024 * 1024) / 8, // 30 Mbps
    upload: (8 * 1024 * 1024) / 8, // 8 Mbps
    latency: 20, // 20 ms
  },
  LTE: {
    download: (300 * 1024 * 1024) / 8, // 300 Mbps
    upload: (50 * 1024 * 1024) / 8, // 50 Mbps
    latency: 5, // 5 ms
  },
};

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calculate LCP.
 */
function calcLCP() {
  window.largestContentfulPaint = 0;

  const observer = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    window.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
  });

  observer.observe({ type: "largest-contentful-paint", buffered: true });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      observer.takeRecords();
      observer.disconnect();
    }
  });
}

/**
 * Get LCP for a given URL.
 * @param {string} url
 * @param {object} networkProfile
 * @returns
 */
async function getLCP(url, networkProfile) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
    timeout: 10000,
  });

  try {
    const page = await browser.newPage();
    const client = await page.target().createCDPSession();

    await client.send("Network.enable");
    await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.evaluateOnNewDocument(calcLCP);
    await page.emulateNetworkConditions(networkProfile);
    await page.emulate(KnownDevices["iPhone 13"]);

    await page.goto(url, { waitUntil: "load", timeout: 1000 * 10 });

    // NOTE: This is a hack to wait for the page to load.
    await page.waitForXPath("//a[contains(text(), 'Get started')]");
    await timeout(1000);

    let lcp = await page.evaluate(() => {
      return window.largestContentfulPaint;
    });
    return lcp;
  } catch (error) {
    console.log(LOG_PREFIX, error);
    browser.close();
  } finally {
    browser.close();
  }
}

/**
 * Measure Largest Contentful Paint (LCP) for a given URL.
 * @param {object} options
 * @param {string} options.url - URL to measure.
 * @param {number} options.iterations - Number of times to measure the URL.
 * @param {string} options.outputPath - Path to save the output.
 * @returns {Promise<Array>} - Array of LCP measurements.
 * @example
 */
const runLCPMetrics = async ({ url, iterations = 3, outputPath }) => {
  const results = [];
  console.log(
    LOG_PREFIX,
    `With network profiles: ${Object.keys(networkProfiles).join(", ")}`
  );
  for (let i = 0; i < iterations; i++) {
    console.log(LOG_PREFIX, `Run iteration ${i + 1} of ${iterations}`);
    for (const [key, networkProfile] of Object.entries(networkProfiles)) {
      const lcp = await getLCP(url, networkProfile);
      const lcpSeconds = lcp / 1000;
      console.log(LOG_PREFIX, key, lcpSeconds, "seconds");
      results.push({
        iteration: i,
        network: key,
        lcpMilliseconds: lcp,
        lcpSeconds,
      });
    }
    // Wait 2 seconds between iterations
    await timeout(2000);
  }

  console.log(LOG_PREFIX, "Save metrics to file");
  await fs.writeFile(
    path.join(outputPath, "lcp-import.js"),
    `var lcpMetrics = ${JSON.stringify(results)};`
  );
  console.log(LOG_PREFIX, "Done");
};

module.exports = { runLCPMetrics };
