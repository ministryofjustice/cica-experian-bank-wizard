# cica-experian-bank-wizard

Experian Bankwizard is an API that interacts with Experian's Bank Wizard SOAP API that verifies bank account details. Consumed by the case management system.

# Prerequisites

This project was developed with the following system dependencies:
- NPM `">=11.6.2"`
- Node `">=24.13.0"`

# Installation

- Clone the repo down to your machine
- Run `npm install`
- Copy the **external Experian artifacts** into the project (see below) — these are **not** committed to git
- Copy `template.env` to `.env` and fill out the required environment variables (see below)

## Required external artifacts

The WSDLs, their XSD schemas, and the SSL certificates are Experian-supplied and are
deliberately gitignored (`xsd/` and `ssl/`). A fresh clone will **not** run until these are
copied in. They can be obtained from the Infrastructure vault, from Experian directly, or
copied out of a running deployment pod (they are baked into the image at build time).

Place them as follows:

```
./BankWizardService-v1.wsdl        # root
./BankWizardCardService-v1.wsdl    # root
./TokenService.wsdl                # root
./xsd/                             # all Bank Wizard XSD schema files (imported by the WSDLs)
./ssl/ExperianIssueCA.cer          # CA chain (real Experian only)
./ssl/ExperianCARootInter.cer      # CA chain (real Experian only)
./ssl/experianuat/publicCert.pem   # client cert/key per environment (real Experian only)
./ssl/experianuat/privateKeyDecrypted.pem
./ssl/experianprod/publicCert.pem
./ssl/experianprod/privateKeyDecrypted.pem
```

Notes:
- `BankWizardService-v1.wsdl` imports `xsd/BankWizardService-v1-0.xsd` and `xsd/BankWizardService-v1-1.xsd`, which in turn import the common schemas. Copy the **whole `xsd/` folder** rather than individual files.
- The `ssl/` certificates are only needed to talk to the **real** Experian servers. The local stub does not need them.
- If you have `kubectl` access, the quickest way to grab them is to copy them out of a running pod, e.g. `kubectl cp -n <namespace> <namespace>/<pod>:xsd ./xsd` and the same for `ssl`.

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
directly as user `1015`, without npm or npx. It is the default build target, so CircleCI's
existing `docker build --no-cache -t cica/cica-experian .` command still builds the production
image, including the WSDL, XSD and SSL artifacts downloaded before the build.

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

> Note: `npm run start:stub` launches the dev server and the stub together. If you see
> `EADDRINUSE: address already in use :::8000`, a previous stub (or `bin/www`) is still running.
> Clear it first, e.g. `pkill -f bankwizard-stub; pkill -f bin/www; pkill -f nodemon`.

## Using the real Experian servers

Set `BANKWIZARD_URL` and `TOKEN_SERVICE_URL` to the remote endpoints, make sure the SSL
certificates above are in place (`BANKWIZARD_ENV` selects the `ssl/experian{env}/` folder), and
run `npm run start:dev`. Note that the Experian endpoints are IP-restricted, so this only works
from an allowlisted network.

Current Experian endpoints: Ask the infra team for details.


To start the service as in production (without nodemon) set the environment variables and run `npm start`.

## Contributors

Thanks to the following people who have contributed to this project:

-   [@harryryan1](https://github.com/harryryan1)
-   [@jack-burt-is](https://github.com/jack-burt-is)
-   [@ross75](https://github.com/ross75)

## License

This project uses the following license: MIT.
