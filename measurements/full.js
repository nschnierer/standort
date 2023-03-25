const fs = require("fs/promises");
const puppeteer = require("puppeteer");
const jsdom = require("jsdom");

const BASE_URL = process.env.BASE_URL ?? "https://standort.live";
const CLIENTS_NUMBER = Number.parseInt(process.env.CLIENTS_NUMBER, 10) || 1;

const ROOT_PATH = `${process.cwd()}/measurements`;
const OUTPUT_PATH = `${ROOT_PATH}/output`;
const BASE_LAT_LNG = [51.9, 7.5];

/**
 * Randomizes the latitude and longitude values
 * in a given array up to a specified number of decimal places.
 */
function randomizeLatLng(latLng, decimalPlaces = 1) {
  const [lat, lng] = latLng;
  const multiplier = Math.pow(10, decimalPlaces);
  const randomLat = parseFloat(
    (lat + Math.random() / multiplier).toFixed(decimalPlaces + 4)
  );
  const randomLng = parseFloat(
    (lng + Math.random() / multiplier).toFixed(decimalPlaces + 4)
  );
  return [randomLat, randomLng];
}

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class StandortClient {
  constructor({ username }) {
    this.username = username;
    this.browser = null;
    this.page = null;
    this.shareData = null;

    this.baseLatLng = randomizeLatLng(BASE_LAT_LNG, 1);
    this.geoLocationInterval;

    this.metricsCollectInterval;
    this.metricsCollectDelay = 500;
    this.metrics = [];
  }

  isRegistered() {
    return this.shareData !== null;
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

  async setGeolocationWithRandomness() {
    const [latitude, longitude] = randomizeLatLng(this.baseLatLng, 2);
    await this.page.setGeolocation({ latitude, longitude });
  }

  async startMockingGeolocation(delay = 1000) {
    clearInterval(this.geoLocationInterval);
    this.setGeolocationWithRandomness();
    this.geoLocationInterval = setInterval(async () => {
      this.setGeolocationWithRandomness();
    }, delay);
  }

  async register() {
    this.browser = await puppeteer.launch({ headless: true, devtools: true });
    this.page = await this.browser.newPage();

    await this.page.setViewport({ width: 375, height: 667 });

    // Grants permission for changing geolocation
    const context = this.browser.defaultBrowserContext();
    await context.overridePermissions(BASE_URL, ["geolocation"]);

    await this.page.goto(BASE_URL, { waitUntil: "networkidle0" });

    // Click the button with text "Get started"
    const getStartedLink = await this.page.$x(
      "//a[contains(text(), 'Get started')]"
    );
    await getStartedLink[0].click();

    // Type text into the input with label "name"
    const nameInput = await this.page.$x(
      "//label[contains(text(), 'Your name')]/following-sibling::div/input"
    );
    await nameInput[0].type(this.username);

    const nextButton = await this.page.$x("//button[contains(text(), 'Next')]");
    await nextButton[0].click();

    await this.page.waitForXPath("//button[contains(text(), 'Download')]");
    const downloadButton = await this.page.$x(
      "//button[contains(text(), 'Download')]"
    );
    await downloadButton[0].click();

    const finishButton = await this.page.$x(
      "//button[contains(text(), 'Next')]"
    );
    await finishButton[0].click();

    await this.page.waitForXPath("//a[@aria-label='Identity']");
    const identityLink = await this.page.$x("//a[@aria-label='Identity']");
    await identityLink[0].click();

    this.shareData = await this.page.evaluate((xpath) => {
      const element = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
      return element.getAttribute("data-value");
    }, "//img[@alt='QR-Code']");

    console.log("Registered user with name:", this.username);
  }

  async addContact(username, foreignShareData) {
    if (!this.isRegistered()) {
      throw new Error("User is not registered");
    }

    const url = `${BASE_URL}/#/c/${foreignShareData}`;
    await this.page.goto(url, { waitUntil: "networkidle0" });
    await this.page.waitForXPath(`//div[contains(text(), '${username}')]`);
    // Go back to main page because mounted will not be called again,
    // if the same page is visited again.
    await this.page.goto(BASE_URL, { waitUntil: "networkidle0" });
    await this.page.waitForXPath("//a[@aria-label='Identity']");
  }

  async shareLocationWith(username) {
    await this.page.goto(`${BASE_URL}/#/contacts`, {
      waitUntil: "networkidle0",
    });

    const xPath = `//input[@type="checkbox" and @aria-label="Select ${username}"]`;
    await this.page.waitForXPath(xPath);
    const checkbox = await this.page.$x(xPath);
    await checkbox[0].click();

    const shareWithSelected = await this.page.$x(
      "//button[contains(text(), 'Share with selected')]"
    );
    await shareWithSelected[0].click();
  }

  async takeScreenshot(filename, delay = 0) {
    await timeout(delay);
    await this.page.screenshot({ path: `${OUTPUT_PATH}/${filename}.png` });
  }

  async close() {
    clearInterval(this.geoLocationInterval);
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

  console.log(`Create and register ${CLIENTS_NUMBER} clients`);

  for (let i = 0; i < CLIENTS_NUMBER; i++) {
    const username = `User${i.toString().padStart(3, "0")}`;
    clients.push(new StandortClient({ username }));
  }
  await Promise.all(clients.map((client) => client.register()));

  console.log(`Successfully registered ${CLIENTS_NUMBER} clients`);

  console.log(`Create and register main client`);
  const mainClient = new StandortClient({ username: "Main" });
  await mainClient.register();
  console.log(`Successfully registered main client`);

  // Add all clients to main client
  let mainContactCounter = 0;
  for (const client of clients) {
    // Do it in series to avoid overlapping requests
    await mainClient.addContact(client.username, client.shareData);
    mainContactCounter += 1;
    console.log(
      `Added ${client.username} to main client (${mainContactCounter}/${clients.length})`
    );
  }
  // Add main client to all clients
  await Promise.all(
    clients.map((client) =>
      client.addContact(mainClient.username, mainClient.shareData)
    )
  );

  await mainClient.takeScreenshot("screen-1");

  await timeout(2000);

  // Start mocking geolocation for all clients
  await Promise.all([
    ...clients.map((client) => client.startMockingGeolocation()),
    mainClient.startMockingGeolocation(),
  ]);

  // Collect metrics when no location is shared
  await mainClient.collectMetrics();

  // Start sharing location with clients step by step
  for (const client of clients) {
    await mainClient.shareLocationWith(client.username);
    await client.shareLocationWith(mainClient.username);
    console.log(
      `Start sharing location with ${client.username} in both directions`
    );
    await timeout(1000);
    await mainClient.collectMetrics();
    await timeout(1000);
  }

  await mainClient.writeMetrics("metrics");

  await mainClient.takeScreenshot("screen-2");

  console.log("Close all clients");

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
