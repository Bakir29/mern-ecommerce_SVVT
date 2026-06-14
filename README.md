# MERN Ecommerce — SVVT Course Project Fork

> **This is a fork of [mohamedsamara/mern-ecommerce](https://github.com/mohamedsamara/mern-ecommerce)**, originally licensed under the [MIT License](LICENSE) (Copyright (c) 2019 Mohamed Samara). It is used here as the subject application for a **Software Verification, Validation, and Testing (SVVT)** master's course project — the goal is to apply a full V&V pipeline (static analysis, test design, unit/integration/system/regression testing, coverage analysis, bug reporting & fixing) to a real, non-trivial, full-stack application, **not** to build new product features.
>
> **All SVVT-specific work lives in two new top-level folders, on top of the preserved original source and commit history:**
> - [`ProjectPlan/`](ProjectPlan/00_Master_Plan.md) — the verification & validation plan: phase breakdown, test-design guidance (BVA/EP/decision tables), test-execution strategy, bug-tracking workflow, report & presentation guides, and a living [`TODO.md`](ProjectPlan/TODO.md) tracker documenting every confirmed defect found so far (functional, business-logic, security/access-control, and input-validation bugs — each with root cause, reproduction steps, and a proposed fix)
> - [`static-analysis/`](static-analysis/STATIC_ANALYSIS_REPORT.md) — a completed two-part static analysis pass (ESLint + `eslint-plugin-security`/`react`/`react-hooks`/`jsx-a11y` across both `server/` and `client/`), with full findings, code-level root causes, proposed fixes, and critical triage of false positives
>
> **Live deployment (SVVT fork):**
> - Storefront (client): https://mern-ecommerce-svvt-client.onrender.com/
> - API (server): https://mern-ecommerce-svvt-api.onrender.com/api
> - Database: MongoDB Atlas (free M0 cluster), seeded with sample products/brands/categories
>
> The original README for the application itself follows below, unmodified.

## Description

An ecommerce store built with MERN stack, and utilizes third party API's. This ecommerce store enable three main different flows or implementations:

1. Buyers browse the store categories, products and brands
2. Sellers or Merchants manage their own brand component
3. Admins manage and control the entire store components 

### Features:

  * Node provides the backend environment for this application
  * Express middleware is used to handle requests, routes
  * Mongoose schemas to model the application data
  * React for displaying UI components
  * Redux to manage application's state
  * Redux Thunk middleware to handle asynchronous redux actions

## Demo

This application is deployed on Vercel Please check it out :smile: [here](https://mern-store-gold.vercel.app).

See admin dashboard [demo](https://mernstore-bucket.s3.us-east-2.amazonaws.com/admin.mp4)

## Docker Guide

To run this project locally you can use docker compose provided in the repository. Here is a guide on how to run this project locally using docker compose.

Clone the repository
```
git clone https://github.com/mohamedsamara/mern-ecommerce.git
```

Edit the dockercompose.yml file and update the the values for MONGO_URI and JWT_SECRET

Then simply start the docker compose:

```
docker-compose build
docker-compose up
```

## Database Seed

* The seed command will create an admin user in the database
* The email and password are passed with the command as arguments
* Like below command, replace brackets with email and password. 
* For more information, see code [here](server/utils/seed.js)

```
npm run seed:db [email-***@****.com] [password-******] // This is just an example.
```

## Install

`npm install` in the project root will install dependencies in both `client` and `server`. [See package.json](package.json)

Some basic Git commands are:

```
git clone https://github.com/mohamedsamara/mern-ecommerce.git
cd project
npm install
```

## ENV

Create `.env` file for both client and server. See examples:

[Frontend ENV](client/.env.example)

[Backend ENV](server/.env.example)


## Vercel Deployment

Both frontend and backend are deployed on Vercel from the same repository. When deploying on Vercel, make sure to specifiy the root directory as `client` and `server` when importing the repository. See [client vercel.json](client/vercel.json) and [server vercel.json](server/vercel.json).

## Start development

```
npm run dev
```

## Languages & tools

- [Node](https://nodejs.org/en/)

- [Express](https://expressjs.com/)

- [Mongoose](https://mongoosejs.com/)

- [React](https://reactjs.org/)

- [Webpack](https://webpack.js.org/)


### Code Formatter

- Add a `.vscode` directory
- Create a file `settings.json` inside `.vscode`
- Install Prettier - Code formatter in VSCode
- Add the following snippet:  

```json

    {
      "editor.formatOnSave": true,
      "prettier.singleQuote": true,
      "prettier.arrowParens": "avoid",
      "prettier.jsxSingleQuote": true,
      "prettier.trailingComma": "none",
      "javascript.preferences.quoteStyle": "single",
    }

```

