const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate to the page you want to measure
  await page.goto("https://google.com");

  // Measure LCP
  const lcp = await page.evaluate(() => {
    return new Promise((resolve) => {
      // Get all the images, videos, and iframes on the page
      const elements = document.querySelectorAll("img, video, iframe");

      // Calculate the size of the largest element
      let maxSize = 0;
      for (const element of elements) {
        const size =
          element.getBoundingClientRect().width *
          element.getBoundingClientRect().height;
        if (size > maxSize) {
          maxSize = size;
        }
      }

      // Wait for the largest element to become visible
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === "largest-contentful-paint") {
            resolve(entry.startTime);
            observer.disconnect();
          }
        }
      });
      observer.observe({ type: "largest-contentful-paint", buffered: true });
    });
  });

  console.log("LCP:", lcp);

  // Measure FID
  const fid = await page.evaluate(() => {
    return new Promise((resolve) => {
      // Create a button that will be used to simulate user input
      const button = document.createElement("button");
      button.textContent = "Click me";
      document.body.appendChild(button);

      // Listen for the button click and measure the time it takes to respond
      button.addEventListener("click", () => {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === "first-input-delay") {
              resolve(entry.processingStart - entry.startTime);
              observer.disconnect();
            }
          }
        });
        observer.observe({ type: "first-input", buffered: true });
      });
    });
  });

  console.log("FID:", fid);

  await browser.close();
})();
