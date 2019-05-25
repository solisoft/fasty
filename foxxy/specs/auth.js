const { expect } = require('chai')


describe('BO : Login', function () {

  it('display login page', async function () {
    this.timeout(15000)
    await page.goto('http://test.127.0.0.1.xip.io:4001')
    await page.screenshot({ path: 'specs/pictures/login_page.png'})
    const url = await page.evaluate(() => document.location.href)
    expect(url).to.equal("http://test.127.0.0.1.xip.io:4001/login.html#login")
  })

  it('fail to login', async function() {
    this.timeout(15000)
    await page.click('#username')
    await page.evaluate(() => $("#username").val("demo@foxxy.ovh"))
    await page.click('#password')
    await page.evaluate(() => $("#password").val("demo_"))

    await page.click('button')
    await page.waitFor(500)
    const url = await page.evaluate(() => document.location.href)
    expect(url).to.equal("http://test.127.0.0.1.xip.io:4001/login.html#login")
  })

  it('success to login', async function() {
    this.timeout(15000)
    await page.click('#username')
    await page.evaluate(() => $("#username").val("demo@foxxy.ovh"))
    await page.click('#password')
    await page.evaluate(() => $("#password").val("977cebdd"))

    await page.click('button')
    await page.waitFor(500)
    const url = await page.evaluate(() => document.location.href)
    expect(url).not.equal("http://test.127.0.0.1.xip.io:4001/login.html#login")
    expect(url).to.equal("http://test.127.0.0.1.xip.io:4001/index.html#welcome")
    await page.screenshot({ path: 'specs/pictures/welcome.png'})

  })

  it('check frontend respond properly', async function() {
    this.timeout(15000)
    await page.click('body > div.uk-container.uk-container-expand.uk-container-center.uk-margin-top > div > div.uk-width-auto > div > ul > li:nth-child(11) > a')
    await page.screenshot({ path: 'specs/pictures/pages.png'})
    await page.click('#list > tr > td.uk-text-center > a.uk-button.uk-button-primary.uk-button-small')
    await page.screenshot({ path: 'specs/pictures/page_edit.png'})
    await page.waitFor('input[type=submit]')
    await page.click('input[type=submit]')
    await page.goto('http://test.127.0.0.1.xip.io:8080')
    await page.screenshot({ path: 'specs/pictures/fe.png'})
  })
})