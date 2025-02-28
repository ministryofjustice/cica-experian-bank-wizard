# cica-experian-bank-wizard

Experian Bankwizard is an API that interacts with Experian's Bank Wizard SOAP API that verifies bank account details. Consumed by the case management system.

# Prerequisites

This project was developed with the following system dependencies:
- NPM `">=10.8.2"`
- Node `">=20.17.0"`

# Installation

- Clone the repo down to your machine
- Run `npm install`
- Copy the WSDL files for the Bank Wizard and Token Service into the root of the project
- Copy template.env to .env and fill out the required environment variables

If you're planning to connect to the remote Experian servers
- Copy the appropriate SSL Certificates into `/ssl/experian{prod/uat}/`

## Using Experian Bankwizard

Due to IP restriction restraints, a stub has been developed to run in place of a remote server when developing locally.
To use this run configuration, set the `BANKWIZARD_URL` and `TOKEN_SERVICE_URL` environment variables to `http://localhost:3100/wsdl` and run `npm run start:stub`

If using the UAT or Production Experian servers instead, set the `BANKWIZARD_URL` and `TOKEN_SERVICE_URL` environment variables to the remote servers and run `npm run start:dev`

To start the service as in production (without nodemon) set the environment variables and run `npm start`

Once the service is running the API docs can be accessed at `http://localhost:3100/docs`

## Contributors

Thanks to the following people who have contributed to this project:

-   [@harryryan1](https://github.com/harryryan1)
-   [@jack-burt-is](https://github.com/jack-burt-is)
-   [@ross75](https://github.com/ross75)

## License

This project uses the following license: MIT.
