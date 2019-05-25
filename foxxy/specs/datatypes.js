const { expect } = require('chai')


describe('BO : Datatypes', function () {

  it('go to datatypes page', async function () {
    this.timeout(15000)
    await page.goto('http://test.127.0.0.1.xip.io:4001/#datatypes')
    await page.screenshot({ path: 'specs/pictures/datasets.png'})
    const url = await page.evaluate(() => document.location.href)
    const found = (await page.content()).match(/Listing datatypes/gi)
    expect(url).to.equal("http://test.127.0.0.1.xip.io:4001/#datatypes")
  })

  it('create a new posts datatypes', async function () {
    this.timeout(15000)
    await page.waitFor('#app > div > a')
    await page.click('#app > div > a')
    await page.waitFor('#name')
    await page.click('#name')
    await page.evaluate(() => $("#name").val("Posts"))
    await page.click('#slug')
    await page.evaluate(() => $("#slug").val("posts"))

    await page.click('.ace_content')
    await page.evaluate(() => {
      var editor = ace.edit('editor_javascript')
      editor.getSession().setValue(unescape(`{
  "model": [
    { "r": true, "c": "1-2", "n": "title", "t": "string", "l": "Title", "j": "joi.string().required()", "tr": true },
    { "r": false, "c": "1-2", "n": "slug", "t": "string", "l": "Slug", "j": "joi.string().required()", "tr": true },
    { "r": true, "c": "1-2", "n": "published_at", "t": "date", "j": "joi.date().format('YYYY-MM-DD').raw().required()", "l": "Published_at" },
    { "r": false, "c": "1-2", "n": "online", "t": "boolean", "l": "Online?", "j": "joi.number().integer()" },
    { "r": true, "c": "1-1", "n": "tags", "t": "tags", "l": "Tags", "j": "joi.any()", "d": "LET tags = (FOR doc IN datasets FILTER doc.type=='posts' AND doc.tags != NULL RETURN doc.tags) RETURN UNIQUE(FLATTEN(tags))" },
    { "r": true, "c": "1-2", "n": "trailer", "t": "html", "l": "Trailer", "j": "joi.string()", "tr": true },
    { "r": false, "c": "1-2", "n": "content", "t": "html", "l": "Content", "j": "joi.string()", "tr": true }
  ],
  "columns": [
    { "name": "title" },
    { "name": "slug" },
    { "name": "online", "toggle": true, "values": { "true": "online", "false": "offline" } }
  ],
  "sortable": true
}
      `));
    })
    await page.screenshot({ path: 'specs/pictures/datatype_posts.png'})
    await page.click('input[type=submit]')
    await page.screenshot({ path: 'specs/pictures/datatype_posts_saved.png'})
    await page.goto('http://test.127.0.0.1.xip.io:4001/')
    await page.reload()
    await page.screenshot({ path: 'specs/pictures/datasets.png'})
    const content = await page.evaluate(() => $("html").text())
    const found = content.indexOf('Posts')
    expect(found).to.not.equal(-1)
  })

})

describe('BO : Datasets', function () {
  it('create a new Posts dataset', async function () {
    this.timeout(15000)
    await page.goto("http://test.127.0.0.1.xip.io:4001/#datasets/posts/new")
    await page.screenshot({ path: 'specs/pictures/dataset_post_new.png'})
    await page.waitFor('input[type=submit]')
    await page.click("input[type=submit]")
    await page.screenshot({ path: 'specs/pictures/dataset_saved.png'})
    const content = await page.evaluate(() => $("html").text())
    const found = content.indexOf('must be a string')
    expect(found).to.not.equal(-1)
  })
})