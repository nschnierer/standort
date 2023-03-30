const fs = require("fs/promises");
const puppeteer = require("puppeteer");
const jsdom = require("jsdom");

const BASE_URL = process.env.BASE_URL ?? "";
const CLIENTS_NUMBER = Number.parseInt(process.env.CLIENTS_NUMBER, 10) || 1;
const ROOT_PATH = `${process.cwd()}/measurements`;
const OUTPUT_PATH = `${ROOT_PATH}/output-docs`;

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class GoogleDocsClient {
  constructor() {
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
      `${OUTPUT_PATH}/${filename}.json`,
      JSON.stringify(this.metrics)
    );

    await fs.writeFile(
      `${OUTPUT_PATH}/${filename}.js`,
      `var metrics = ${JSON.stringify(this.metrics)}`
    );

    console.log(`Stopped collecting metrics`);
    this.metrics = [];
  }

  async openDocument() {
    this.browser = await puppeteer.launch({
      headless: true,
      devtools: true,
    });
    this.page = await this.browser.newPage();

    await this.page.setViewport({ width: 1280, height: 720 });

    await this.page.goto(BASE_URL);
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
    await this.page.screenshot({ path: `${OUTPUT_PATH}/${filename}.png` });
  }

  async close() {
    clearInterval(this.writingInterval);
    if (this.browser) {
      await this.browser.close();
    }
  }
}

const startSimulation = async () => {
  if (CLIENTS_NUMBER > 100) {
    console.error("ERROR: 'CLIENTS_NUMBER' cannot be greater than 100");
    process.exit(1);
  }

  const clients = [];

  for (let i = 0; i < CLIENTS_NUMBER; i++) {
    clients.push(new GoogleDocsClient());
  }

  const mainClient = new GoogleDocsClient();
  await mainClient.openDocument();
  await mainClient.clearDocument();

  await mainClient.takeScreenshot("screen-1");

  // Collect metrics when no location is shared
  await mainClient.collectMetrics();

  const activeClients = [];

  // Start sharing location with clients step by step
  for (const client of clients) {
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

  await mainClient.writeMetrics("metrics");

  await mainClient.takeScreenshot("screen-2");

  await mainClient.clearDocument();

  await Promise.all([
    ...clients.map((client) => client.close()),
    mainClient.close(),
  ]);
};

const cleanAndCreateOutputDir = async () => {
  try {
    await fs.rm(OUTPUT_PATH, { recursive: true });
  } catch (error) {
    // ignore
  }
  await fs.mkdir(OUTPUT_PATH);
};

(async () => {
  await cleanAndCreateOutputDir();
  await startSimulation();

  process.exit(0);
})();
