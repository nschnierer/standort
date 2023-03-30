const fs = require("fs");
const plotly = require("plotly");

const ROOT_PATH = `${process.cwd()}/measurements`;

fs.readFile(`${ROOT_PATH}/clientA.json`, "utf8", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }

  console.log("data", data.slice(0, 100), "...");
  const tracingData = JSON.parse(data);
  const metrics = {
    cpuUsage: [],
    memoryUsage: [],
    frameRates: [],
  };

  tracingData.forEach((event) => {
    if (event.name === "CpuUsage") {
      metrics.cpuUsage.push({ ts: event.ts, cpu: event.args.data.cpu_percent });
    } else if (event.name === "UpdateCounters") {
      metrics.memoryUsage.push({
        ts: event.ts,
        mem: event.args.data.jsHeapSizeUsed,
      });
    } else if (event.name === "FrameRate") {
      metrics.frameRates.push({ ts: event.ts, fps: event.args.data.fps });
    }
  });

  // Generate the chart
  const cpuTrace = {
    x: metrics.cpuUsage.map((entry) => entry.ts),
    y: metrics.cpuUsage.map((entry) => entry.cpu),
    mode: "lines",
    name: "CPU Usage (%)",
  };

  const memoryTrace = {
    x: metrics.memoryUsage.map((entry) => entry.ts),
    y: metrics.memoryUsage.map((entry) => entry.mem),
    mode: "lines",
    name: "Memory Usage (bytes)",
    yaxis: "y2",
  };

  const frameRateTrace = {
    x: metrics.frameRates.map((entry) => entry.ts),
    y: metrics.frameRates.map((entry) => entry.fps),
    mode: "lines",
    name: "Frame Rate (fps)",
    yaxis: "y3",
  };

  const layout = {
    title: "Tracing Profile Metrics",
    xaxis: { title: "Timestamp" },
    yaxis: { title: "CPU Usage (%)", side: "left" },
    yaxis2: {
      title: "Memory Usage (bytes)",
      overlaying: "y",
      side: "right",
      position: 0.85,
    },
    yaxis3: {
      title: "Frame Rate (fps)",
      overlaying: "y",
      side: "right",
      position: 1,
    },
  };

  const chartData = [cpuTrace, memoryTrace, frameRateTrace];

  const graphOptions = {
    filename: "tracing_profile_chart",
    fileopt: "overwrite",
    layout: layout,
  };

  plotly.plot(chartData, graphOptions, (err, msg) => {
    if (err) {
      console.error(err);
      return;
    }

    console.log(`Chart URL: ${msg.url}`);
  });
});

function extractPerformanceData(profile) {
  const cpuUsage = [];
  const memoryUsage = [];
  const frameRate = [];

  for (const entry of profile.traceEvents) {
    switch (entry.name) {
      case "CpuProfile":
        cpuUsage.push({ ts: entry.ts, cpu: entry.args.data.cpu_percent });
        break;
      case "UpdateCounters":
        memoryUsage.push({
          time: entry.ts,
          value: entry.args.data.jsHeapSizeUsed,
        });
        break;
      case "FrameRate":
        frameRate.push({
          time: entry.ts,
          value: entry.args.data,
        });
        break;
    }
  }

  return {
    cpuUsage,
    memoryUsage,
    frameRate,
  };
}
