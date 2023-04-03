const fs = require("fs/promises");
const puppeteer = require("puppeteer");

const BASE_LAT_LNG = [51.9, 7.5];
const LOG_PREFIX = "[Standort Metrics]";

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
  constructor({ url, username, outputPath, screenshotEveryStep }) {
    this.url = url;
    this.outputPath = outputPath;
    this.username = username;
    this.browser = null;
    this.page = null;
    this.shareData = null;

    this.baseLatLng = randomizeLatLng(BASE_LAT_LNG, 1);
    this.geoLocationInterval;

    this.metricsCollectInterval;
    this.metricsCollectDelay = 500;
    this.metrics = [];

    this.screenshotEveryStep = screenshotEveryStep;
    this.screenshotCounter = 0;
  }

  async takeScreenshotsEveryStep(delay) {
    this.screenshotCounter += 1;
    const paddedCounter = this.screenshotCounter.toString().padStart(2, "0");
    if (this.screenshotEveryStep) {
      await this.takeScreenshot(
        `${this.screenshotEveryStep}-${paddedCounter}`,
        delay
      );
    }
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
    await fs.writeFile(
      `${this.outputPath}/${filename}.js`,
      `var standortMetrics = ${JSON.stringify(this.metrics)}`
    );

    console.log(LOG_PREFIX, `Stopped collecting metrics`);
    this.metrics = [];
  }

  async setGeolocationWithRandomness() {
    try {
      const context = this.browser.defaultBrowserContext();
      await context.overridePermissions(this.url, ["geolocation"]);
    } catch (e) {
      // Ignore error
    }

    const [latitude, longitude] = randomizeLatLng(this.baseLatLng, 2);
    await this.page.setGeolocation({ latitude, longitude, accuracy: 10 });
  }

  async startMockingGeolocation(delay = 1000) {
    clearInterval(this.geoLocationInterval);
    this.setGeolocationWithRandomness();
    this.geoLocationInterval = setInterval(
      this.setGeolocationWithRandomness.bind(this),
      delay
    );
  }

  async register(fullLogs = false) {
    this.browser = await puppeteer.launch({ headless: true, devtools: true });
    this.page = await this.browser.newPage();

    await this.page.setViewport({ width: 375, height: 667 });

    // Grants permission for changing geolocation
    const context = this.browser.defaultBrowserContext();
    await context.overridePermissions(this.url, ["geolocation"]);

    if (fullLogs) {
      this.page.on("console", (msg) => {
        const text = msg.text();
        // if (text.includes("watchPosition")) {
        console.log(LOG_PREFIX, "BROWSER LOGS", text);
        // }
      });
    }

    await this.page.goto(this.url, { waitUntil: "networkidle0" });

    await this.takeScreenshotsEveryStep();

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

    await this.takeScreenshotsEveryStep(100);

    await nextButton[0].click();

    await this.takeScreenshotsEveryStep();

    await this.page.waitForXPath("//button[contains(text(), 'Download')]");
    const downloadButton = await this.page.$x(
      "//button[contains(text(), 'Download')]"
    );

    await this.takeScreenshotsEveryStep();

    await downloadButton[0].click();

    const finishButton = await this.page.$x(
      "//button[contains(text(), 'Next')]"
    );
    await finishButton[0].click();

    await this.page.waitForXPath("//a[@aria-label='Identity']");
    const identityLink = await this.page.$x("//a[@aria-label='Identity']");

    await this.takeScreenshotsEveryStep();

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

    await this.takeScreenshotsEveryStep();

    console.log(LOG_PREFIX, "Registered user with name:", this.username);
  }

  async addContact(username, foreignShareData) {
    if (!this.isRegistered()) {
      throw new Error("User is not registered");
    }

    const url = `${this.url}#/c/${foreignShareData}`;
    await this.page.goto(url, { waitUntil: "networkidle0" });
    await this.page.waitForXPath(`//div[contains(text(), '${username}')]`);
    // Go back to main page because mounted will not be called again,
    // if the same page is visited again.
    await this.page.goto(this.url, { waitUntil: "networkidle0" });
    await this.page.waitForXPath("//a[@aria-label='Identity']");
  }

  async shareLocationWith(username) {
    const addContactButton = await this.page.$x(
      "//a[@aria-label='Add contact']"
    );
    await addContactButton[0].click();

    await this.takeScreenshotsEveryStep();

    const xPath = `//input[@type="checkbox" and @aria-label="Select ${username}"]`;
    await this.page.waitForXPath(xPath);
    const checkbox = await this.page.$x(xPath);
    await checkbox[0].click();

    await this.takeScreenshotsEveryStep();

    const shareWithSelected = await this.page.$x(
      "//button[contains(text(), 'Share with selected')]"
    );
    await shareWithSelected[0].click();

    await this.takeScreenshotsEveryStep(8000);
  }

  async takeScreenshot(filename, delay = 0) {
    await timeout(delay);
    await this.page.screenshot({ path: `${this.outputPath}/${filename}.png` });
  }

  async close() {
    clearInterval(this.geoLocationInterval);
    if (this.browser) {
      await this.browser.close();
    }
  }
}

const runStandortMetrics = async ({ url, clientsNumber = 8, outputPath }) => {
  if (clientsNumber > 100) {
    console.error(LOG_PREFIX, "Clients number cannot be greater than 100");
    return;
  }

  const clients = [];

  console.log(LOG_PREFIX, `Create and register ${clientsNumber} clients...`);

  for (let i = 0; i < clientsNumber; i++) {
    const username = `User${i.toString().padStart(3, "0")}`;
    clients.push(new StandortClient({ url, outputPath, username }));
  }
  await Promise.all(clients.map((client) => client.register()));

  console.log(LOG_PREFIX, `Successfully registered ${clientsNumber} clients`);

  console.log(LOG_PREFIX, `Create and register main client`);
  const mainClient = new StandortClient({ url, outputPath, username: "Main" });
  await mainClient.register();
  console.log(LOG_PREFIX, `Successfully registered main client`);

  // Add all clients to main client
  let mainContactCounter = 0;
  for (const client of clients) {
    // Do it in series to avoid overlapping requests
    await mainClient.addContact(client.username, client.shareData);
    mainContactCounter += 1;
    console.log(
      LOG_PREFIX,
      `Added ${client.username} to main client (${mainContactCounter}/${clients.length})`
    );
  }
  // Add main client to all clients
  await Promise.all(
    clients.map((client) =>
      client.addContact(mainClient.username, mainClient.shareData)
    )
  );

  await timeout(2000);

  // Collect metrics when no location is shared
  await mainClient.collectMetrics();
  await mainClient.startMockingGeolocation();

  // Start sharing location with clients step by step
  let count = 1;
  for (const client of clients) {
    await client.startMockingGeolocation();
    await client.shareLocationWith(mainClient.username);
    await timeout(3000);
    await mainClient.shareLocationWith(client.username);
    console.log(
      LOG_PREFIX,
      `Start sharing location with ${client.username} in both directions (${count}/${clients.length})`
    );
    await timeout(3000);
    await mainClient.collectMetrics();
    await timeout(2000);
    await client.takeScreenshot(`standort-${count}-client`);
    await mainClient.takeScreenshot(`standort-${count}-main`);
    count++;
  }

  await mainClient.writeMetrics("standort-import");

  await mainClient.takeScreenshot("standort-metrics-end");

  await Promise.all([
    ...clients.map((client) => client.close()),
    mainClient.close(),
  ]);

  console.log(LOG_PREFIX, "Done");
};

module.exports = { runStandortMetrics, StandortClient };
