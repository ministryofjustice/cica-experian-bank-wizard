# cica-experian-bank-wizard

Experian Bankwizard is an API that interacts with Experian's Bank Wizard SOAP API that verifies bank account details. Consumed by the case management system.

# Prerequisites

This project was developed with the following system dependencies:
- NPM `">=11.6.2"`
- Node `">=24.13.0"`

# Installation

- Clone the repo down to your machine
- Run `npm install`
- Copy the **external WSDL and XSD files** needed for local development into the project (see below) — these are **not** committed to git
- Copy `template.env` to `.env` and fill out the required environment variables (see below)

## Files required for local development

Local stub development and local Docker integration tests require the following Experian-supplied WSDL and XSD files. They are not stored in Git and can be obtained from the Infrastructure vault or directly from Experian.

Place them in the project as follows:

```
./BankWizardService-v1.wsdl
./TokenService.wsdl
./xsd/BankWizardService-v1-0.xsd
./xsd/BankWizardService-v1-1.xsd
./xsd/BankWizardCommon-v1-0.xsd
./xsd/BankWizardAbsoluteCommon-v1-0.xsd
```

The stub reads both WSDLs when it starts, and the application loads them when creating
SOAP clients for requests. The Bank Wizard WSDL imports the listed schemas.
No SSL certificates or private keys are needed locally when using the stub.

## Using Experian Bankwizard (local stub)

Due to Experian IP restrictions, a stub (`stubs/bankwizard-stub.js`) stands in for the remote
server when developing locally. The stub listens on **port 8000** and serves:
- the Bank Wizard service at `/wsdl`
- the Token service at `/token`

Set these in your `.env` and run `npm run start:stub`:

```
NODE_ENV=development
BANKWIZARD_ENV=uat
PORT=3100

BANKWIZARD_URL=http://localhost:8000/wsdl
TOKEN_SERVICE_URL=http://localhost:8000/token
```

The app runs on `PORT` (default `3100`); the stub always runs on `8000`. The API docs are then
available at `http://localhost:3100/docs`.

### Run the app in Docker with the local stub

Run the following commands from the repository root after completing installation.
The Dockerfile uses a builder stage to install dependencies and generate the OpenAPI
contract, then prunes development dependencies. The final `production` stage runs Node
directly as user `1015`, without npm or npx. It is the default build target.

Do not put production certificate materials in the local build context: files in `ssl/`
are included in the Docker image if present, even when using the stub.

The Docker image contains the app, not the local stub. Start the stub on your host in one
terminal:

```sh
npm run stub
```

In another terminal, build the image and run the app:

```sh
docker build -t cica-experian-bank-wizard:local .
docker run --rm --name cica-experian-bank-wizard \
  --add-host=host.docker.internal:host-gateway \
  --env-file .env \
  -e BANKWIZARD_URL=http://host.docker.internal:8000/wsdl \
  -e TOKEN_SERVICE_URL=http://host.docker.internal:8000/token \
  -p 3100:3100 \
  cica-experian-bank-wizard:local
```

The `--add-host` option lets the container reach the stub on the host on Linux. The URL
overrides are needed because `localhost` inside the container refers to the container itself.
The app is available at `http://localhost:3100`. This assumes the required WSDL and XSD
artifacts are present in the build context.

### Local Docker integration test

With Docker running and the external WSDL and XSD files present, run:

```sh
npm run test:integration:local
```

This builds the production image, then starts the app and SOAP stub inside a temporary
container with networking disabled and an empty, read-only SSL directory. No host ports are published, so an existing app on
port 3100 is unaffected. The test checks status, personal and company responses (including
scores and branch data), plus rejection of an invalid request. It uses fabricated fixtures
and the real HTTP/SOAP clients, not Jest mocks.

The explicit `BANKWIZARD_ENV=stub` mode requires both SOAP URLs to use local HTTP hosts and
skips client-certificate loading. The test overrides the endpoints without reading or
changing your host `.env`, cannot reach Experian, and removes its container on completion.
The locally built `cica-experian-bank-wizard:local-integration` image is retained for reuse.

> Note: `npm run start:stub` launches the dev server and the stub together. If you see
> `EADDRINUSE: address already in use :::8000`, a previous stub (or `bin/www`) is still running.
> Clear it first, e.g. `pkill -f bankwizard-stub; pkill -f bin/www; pkill -f nodemon`.

## Deployed environments

Experian endpoint URLs and credentials are supplied at deployment time. Experian access is IP-restricted. Contact the infrastructure team for deployment configuration details.

To start the service as in production (without nodemon) set the environment variables and run `npm start`.

## Contributors

Thanks to the following people who have contributed to this project:

-   [@harryryan1](https://github.com/harryryan1)
-   [@jack-burt-is](https://github.com/jack-burt-is)
-   [@ross75](https://github.com/ross75)

## License

This project uses the following license: MIT.
