const fs = require("fs/promises");
const puppeteer = require("puppeteer");
const { StandortClient } = require("./standortMetrics.js");

const LOG_PREFIX = "[Standort Screenshots]";

const nameList = ["Jovita", "Evelína", "Grace", "Heidi"];

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runStandortScreenshots = async ({
  url,
  clientsNumber = 2,
  outputPath,
}) => {
  if (clientsNumber > 4) {
    console.error(LOG_PREFIX, "Clients number cannot be greater than 100");
    return;
  }

  const clients = [];

  console.log(LOG_PREFIX, `Create and register ${clientsNumber} clients...`);

  for (let i = 0; i < clientsNumber; i++) {
    const username = nameList[i];
    clients.push(
      new StandortClient({
        url,
        outputPath,
        username,
      })
    );
  }
  await Promise.all(clients.map((client) => client.register()));

  console.log(LOG_PREFIX, `Successfully registered ${clientsNumber} clients`);

  console.log(LOG_PREFIX, `Create and register main client`);
  const mainClient = new StandortClient({
    url,
    outputPath,
    username: "MainUser",
    // Creates screenshot for every step with prefix "step"
    screenshotEveryStep: "step",
  });
  await mainClient.register(true);
  console.log(LOG_PREFIX, `Successfully registered main client`);

  // Add all clients to main client
  let mainContactCounter = 0;
  for (const client of clients) {
    // Do it in series to avoid overlapping requests
    await mainClient.addContact(client.username, client.shareData);
    mainContactCounter += 1;
  }
  // Add main client to all clients
  await Promise.all(
    clients.map((client) =>
      client.addContact(mainClient.username, mainClient.shareData)
    )
  );

  await timeout(2000);

  // Collect metrics when no location is shared
  await mainClient.startMockingGeolocation();

  // Start sharing location with clients step by step
  let count = 1;
  for (const client of clients) {
    await client.startMockingGeolocation();
    await client.shareLocationWith(mainClient.username);
    await mainClient.shareLocationWith(client.username);
    console.log(
      LOG_PREFIX,
      `Start sharing location with ${client.username} in both directions (${count}/${clients.length})`
    );
    await timeout(1000);
    await timeout(2000);
    count++;
  }

  await clients[0].takeScreenshot("standort-1-client");

  await Promise.all([
    ...clients.map((client) => client.close()),
    mainClient.close(),
  ]);

  console.log(LOG_PREFIX, "Done");
};

module.exports = { runStandortScreenshots };
