const fs = require("fs/promises");
const puppeteer = require("puppeteer");

const LOG_PREFIX = "[Docs Metrics]";

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class GoogleDocsClient {
  constructor({ url, outputPath }) {
    this.url = url;
    this.outputPath = outputPath;
    this.browser = null;
    this.page = null;

    this.metricsCollectInterval;
    this.metricsCollectDelay = 500;
    this.metrics = [];

    this.writingInterval;
  }

  async collectMetrics() {
    const metrics = await this.page.metrics();
    const count = this.metrics.length;
    this.metrics.push({ count, ...metrics });
  }

  async writeMetrics(filename) {
    clearInterval(this.metricsCollectInterval);
    // save to file
    await fs.writeFile(
      `${this.outputPath}/${filename}.js`,
      `var docsMetrics = ${JSON.stringify(this.metrics)}`
    );

    console.log(LOG_PREFIX, `Stopped collecting metrics`);
    this.metrics = [];
  }

  async openDocument() {
    this.browser = await puppeteer.launch({
      headless: true,
      devtools: true,
    });
    this.page = await this.browser.newPage();

    await this.page.setViewport({ width: 1280, height: 720 });

    await this.page.goto(this.url);
  }

  async clearDocument() {
    await this.page.keyboard.down("Shift");
    for (let i = 0; i < 100; i++) {
      await this.page.keyboard.press("ArrowDown");
    }
    await this.page.keyboard.up("Shift");
    await timeout(500);
    await this.page.keyboard.press("Backspace");
  }

  async writeSomething() {
    await this.page.keyboard.type(
      "Chocolate bar cotton candy tart pie biscuit."
    );
  }

  async startWriting(delay = 1000) {
    clearInterval(this.writingInterval);
    this.writeSomething();
    this.writingInterval = setInterval(async () => {
      this.writeSomething();
    }, delay);
  }

  async takeScreenshot(filename, delay = 0) {
    await timeout(delay);
    await this.page.screenshot({ path: `${this.outputPath}/${filename}.png` });
  }

  async close() {
    clearInterval(this.writingInterval);
    if (this.browser) {
      await this.browser.close();
    }
  }
}

const runDocsMetrics = async ({ url, clientsNumber = 3, outputPath }) => {
  if (clientsNumber > 100) {
    console.error(LOG_PREFIX, "Clients number cannot be greater than 100");
    process.exit(1);
  }

  const clients = [];

  for (let i = 0; i < clientsNumber; i++) {
    clients.push(new GoogleDocsClient({ url, outputPath }));
  }

  const mainClient = new GoogleDocsClient({ url, outputPath });
  await mainClient.openDocument();
  await mainClient.clearDocument();

  // Collect metrics when no location is shared
  await mainClient.collectMetrics();

  const activeClients = [];

  // Start sharing location with clients step by step
  for (const client of clients) {
    console.log(
      LOG_PREFIX,
      `Client opens the document (${activeClients.length + 1}/${clientsNumber})`
    );
    await client.openDocument();
    activeClients.push(client);

    for (const activeClient of activeClients) {
      await mainClient.writeSomething();
      await activeClient.writeSomething();
    }

    await timeout(1000);
    await mainClient.collectMetrics();
    await timeout(1000);
  }

  await mainClient.writeMetrics("docs-import");

  await mainClient.takeScreenshot("docs-end");

  await mainClient.clearDocument();

  await Promise.all([
    ...clients.map((client) => client.close()),
    mainClient.close(),
  ]);
  console.log(LOG_PREFIX, "Done");
};

module.exports = { runDocsMetrics };
