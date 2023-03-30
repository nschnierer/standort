// Description: Calculates the Largest Contentful Paint (LCP) of a given URL.
//
// Mainly inspired by https://gist.github.com/addyosmani/c053f68aead473d7585b45c9e8dce31e

const puppeteer = require("puppeteer");

const networkProfiles = {
  "3G": {
    download: (750 * 1024) / 8, // 750 Kbps
    upload: (250 * 1024) / 8, // 250 Kbps
    latency: 100, // 100 ms
  },
  "4G": {
    download: (50 * 1024 * 1024) / 8, // 50 Mbps
    upload: (10 * 1024 * 1024) / 8, // 10 Mbps
    latency: 20, // 20 ms
  },
  "5G": {
    download: (1000 * 1024 * 1024) / 8, // 1000 Mbps
    upload: (1000 * 1024 * 1024) / 8, // 1000 Mbps
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
      console.log("LCP:", window.largestContentfulPaint);
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
    args: ["--no-sandbox"],
    timeout: 10000,
  });

  try {
    const page = await browser.newPage();
    const client = await page.target().createCDPSession();

    await page.emulateNetworkConditions(networkProfile);
    await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });

    await page.evaluateOnNewDocument(calcLCP);
    await page.goto(url, { waitUntil: "load", timeout: 60000 });

    let lcp = await page.evaluate(() => {
      return window.largestContentfulPaint;
    });
    return lcp;
  } catch (error) {
    console.log(error);
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
 * @returns {Promise<Array>} - Array of LCP measurements.
 * @example
 */
export const measureLCP = async ({ url, iterations = 3 }) => {
  const results = [];
  for (let i = 0; i < iterations; i++) {
    for (const [key, networkProfile] of Object.entries(networkProfiles)) {
      const lcp = await getLCP(url, networkProfile);
      results.push({
        iteration: i,
        network: key,
        lcp,
      });
    }
    // Wait 2 seconds between iterations
    await timeout(2000);
  }
  return results;
};
