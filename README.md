<img alt="standort.live" src="./assets/standort-banner.jpg" />

<div align="center">
  <h2>
    Standort.live - Share your location with friends and family
  </h2>
</div>

<br />

<div align="center">

<img alt="Build status" src="https://img.shields.io/github/checks-status/nschnierer/standort/main?color=blueviolet" />
<img alt="Test Coverage" src="https://img.shields.io/codecov/c/github/nschnierer/standort?color=blueviolet">
<img alt="License MIT" src="https://img.shields.io/github/license/nschnierer/standort?color=blueviolet">

</div>

<br />
<div align="center">
❕ Prototype Status ❕
</div>
<br />

## Introduction

"Standort" is a web application that makes it easy to share your location with friends and family. Your location remains private because sensitive information is only shared with people you trust using WebRTC.

> This repository was created as part of a bachelor thesis in Geoinformatics at the [Institute for Geoinformatics](https://www.uni-muenster.de/Geoinformatics/), University of Münster.
> The aim of the project is to ensure the reproducibility and traceability of the results for future research.

## Installation

Requirements:

- Node.js 18.x
- NPM 9.

```sh
npm install
```

```sh
npm run build
```

## Development

> NOTE: Please run `build` every time something has changed in `packages'.

Run development mode:

```sh
npm run dev
```

Open http://localhost:5000 to open the web application.

## Configuration

Environment variables for `signaling` service:

- `SIGNALING_PORT`: Listening port (Default: `4000`).
- `SIGNALING_API_KEY` Restrict by an API key (Default: _empty_),

Environment variables for `web` application:

- `VITE_SIGNALING_URL`: Signaling Websocket URL (Default: `ws://localhost:4000`)
- `VITE_SIGNALING_API_KEY`: Signaling API key (Default: _empty_)

> Copy the `.env.sample` to `.env` and customize your configuration.

## Test

Run linter:

```sh
npm run lint
```

Run tests:

```sh
npm run test
```

Run tests with coverage (for CI/CD):

```sh
npm run test:coverage
```

## Measure the application

See [measurements/README.md](./measurements/README.md) for more information.

## Declaration of Authorship

This software, in its version 0.1, has been solely developed by _Noel Schnierer_ as part of the bachelor thesis with the title _WebRTC for privacy enhancement: design, implementation and usability testing of a web-based peer-to-peer live location sharing application_.
