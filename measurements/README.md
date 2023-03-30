## How to measurement the application

The `run.js` script allows you to measure the performance of web applications.

> Make sure you installed Node.js 18+

## Usage

To use the script, open your terminal and navigate to the directory where the script is located. Then run the following command:

```sh
node run.js [options]
```

Replace [options] with one or more of the following options:

- `--lcp-url`: The URL to measure LCP for.
- `--lcp-iterations`: The number of times to measure LCP for the given URL. The default value is 3.
- `--standort-url`: The URL to measure the performance of the Standort app.
- `--standort-clients-number`: The number of clients to simulate when measuring the performance of the Standort app. The default value is 8.
- `--docs-url`: The URL to measure the performance of Google Docs.
- `--docs-clients-number`: The number of clients to simulate when measuring the performance of Google Docs. The default value is 8.

Example:

```sh
node run.js \
    --lcp-url https://example.com \
    --standort-url https://standort.com \
    --docs-url https://docs.google.com/document/d/xxxxxxxxx \
```

Output:

Open `plot.html` in your browser to view the charts.

The script will all metrics into the `output` folder.
