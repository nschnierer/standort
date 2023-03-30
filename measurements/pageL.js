const puppeteer = require("puppeteer");

const measureLoadTime = async (url, networkProfile) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.emulateNetworkConditions(networkProfile);

  let totalDownloadSize = 0;
  page.on("response", async (response) => {
    const contentLength = response.headers()["content-length"];
    if (contentLength) {
      totalDownloadSize += parseInt(contentLength, 10);
    }
  });

  const start = Date.now();
  await page.goto(url, { waitUntil: "networkidle0" });
  const end = Date.now();

  const loadTime = end - start;

  await page.close();
  await browser.close();

  return { loadTime, totalDownloadSize };
};

// Puppeteer network conditions
const networkProfile3G = {
  download: (750 * 1024) / 8, // 750 Kbps
  upload: (250 * 1024) / 8, // 250 Kbps
  latency: 100, // 100 ms
};

const networkProfile4G = {
  download: (50 * 1024 * 1024) / 8, // 50 Mbps
  upload: (10 * 1024 * 1024) / 8, // 10 Mbps
  latency: 20, // 20 ms
};

const networkProfile5G = {
  download: (1000 * 1024 * 1024) / 8, // 1000 Mbps
  upload: (1000 * 1024 * 1024) / 8, // 1000 Mbps
  latency: 5, // 5 ms
};

const main = async () => {
  const url = "https://standort.live";

  const loadTime3G = await measureLoadTime(url, networkProfile3G);
  const loadTime4G = await measureLoadTime(url, networkProfile4G);
  const loadTime5G = await measureLoadTime(url, networkProfile5G);

  console.log("3G", loadTime3G);
  console.log("4G", loadTime4G);
  console.log("5G", loadTime5G);
};

main();
