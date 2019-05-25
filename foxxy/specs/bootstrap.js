const puppeteer = require('puppeteer');
const { expect } = require('chai');
const _ = require('lodash');
const arangojs = require('arangojs');
const db = new arangojs.Database('http://127.0.0.1:8530');

const globalVariables = _.pick(global, ['db', 'browser', 'page', 'expect']);

// puppeteer options
const opts = {
  headless: true,
  slowMo: 0,
  timeout: 10000
};

// expose variables
before (async function () {
  await db.login('root', 'password')
  await db.useDatabase('_system')
  await db.dropDatabase('db_test')
  await db.createDatabase('db_test')
  await db.useDatabase('db_test')

  global.db = db;
  global.expect = expect;
  global.browser = await puppeteer.launch(opts);
  global.page = await global.browser.newPage();

  await Promise.all([
    page.coverage.startJSCoverage(),
    page.coverage.startCSSCoverage()
  ]);

});

// close browser and reset global variables
after (async function () {
  const [jsCoverage, cssCoverage] = await Promise.all([
    page.coverage.stopJSCoverage(),
    page.coverage.stopCSSCoverage(),
  ]);
  let totalBytes = 0;
  let usedBytes = 0;
  const coverage = [...jsCoverage, ...cssCoverage];
  for (const entry of coverage) {
    totalBytes += entry.text.length;
    for (const range of entry.ranges)
      usedBytes += range.end - range.start - 1;
  }
  console.log(`Bytes used: ${(usedBytes / totalBytes * 100).toFixed(2)}%`);
  const pti = require('puppeteer-to-istanbul')
  pti.write(jsCoverage)
  browser.close();
  global.db = globalVariables.db;
  global.browser = globalVariables.browser;
  global.page = globalVariables.page;
  global.expect = globalVariables.expect;
});

const c = require('child_process')

describe('Create Database', function () {
  it('setup test database properly', async function () {
    this.timeout(30000)

    try {
      c.execSync('foxxy upgrade settings --server fasty --database db_test')
      c.execSync('foxxy upgrade uploads --server fasty --database db_test')
      c.execSync('foxxy upgrade auth --server fasty --database db_test')
      c.execSync('foxxy upgrade cruds --server fasty --database db_test')
      c.execSync('foxxy upgrade datasets --server fasty --database db_test')
    } catch(err) { console.log("something went wrong", err)}
  })
})
