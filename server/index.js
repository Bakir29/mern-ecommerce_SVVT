const chalk = require('chalk');

const app = require('./app');
const keys = require('./config/keys');
const socket = require('./socket');
const setupDB = require('./utils/db');

const { port } = keys;

setupDB();

const server = app.listen(port, () => {
  console.log(
    `${chalk.green('✓')} ${chalk.blue(
      `Listening on port ${port}. Visit http://localhost:${port}/ in your browser.`
    )}`
  );
});

socket(server);
