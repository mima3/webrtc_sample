const TestSyncClient = require('../test_sync_client.js')
const tsc = new TestSyncClient(process.env.__NIGHTWATCH_ENV)
module.exports = {

  'before' : function() {
    console.log('before')
    return new Promise((resolve)=> {
      tsc.connect('testsync', ()=> {
        resolve()
      })
    })
  },
  'after' : function() {
    console.log('after')
    tsc.close()
  },
  'WebRTC test' : function(browser) {
    console.log(browser.currentTest);
    const testcase = `${browser.currentTest.module}_${browser.currentTest.name}` 
    console.log(testcase)
    const seleniumA = process.env.__NIGHTWATCH_ENV === 'seleniumA';
      browser
        .url('http://192.168.10.239:3000/')
        .waitForElementVisible('xpath', '//button[contains(.,"公開")]')
        .sendTestEvent(tsc, testcase, 'ready_' + process.env.__NIGHTWATCH_ENV)
      browser
        .waitTestEvent(tsc, testcase, 'ready_seleniumA', 5000)
        .waitTestEvent(tsc, testcase, 'ready_seleniumB', 5000)

      if(seleniumA) {
        browser.click('xpath', '//button[contains(.,"公開")]')
               .waitForElementVisible('xpath', '//button[contains(.,"送信")]')
               .waitForElementVisible('xpath', '//ul/li[contains(.,"テスト入力B")]')
               .setValue('xpath', '//input', 'テスト入力A')
               .saveScreenshot(`./tests_output/${testcase}_001_${process.env.__NIGHTWATCH_ENV}.png`)
               .click('xpath', '//button[contains(.,"送信")]')
      } else {
        browser.waitForElementVisible('xpath', '//button[contains(.,"offer")]')
               .click('xpath', '//button[contains(.,"offer")]')
               .waitForElementVisible('xpath', '//button[contains(.,"送信")]')
               .waitForElementVisible('xpath', '//input')
               .setValue('xpath', '//input', 'テスト入力B')
               .saveScreenshot(`./tests_output/${testcase}_002_${process.env.__NIGHTWATCH_ENV}.png`)
               .click('xpath', '//button[contains(.,"送信")]')
               .waitForElementVisible('xpath', '//ul/li[contains(.,"テスト入力A")]')
      }
      browser
        .saveScreenshot(`./tests_output/${testcase}_003_${process.env.__NIGHTWATCH_ENV}.png`)
        .sendTestEvent(tsc, testcase, 'finished_' + process.env.__NIGHTWATCH_ENV)
        .waitTestEvent(tsc, testcase, 'finished_seleniumA', 5000) 
        .waitTestEvent(tsc, testcase, 'finished_seleniumB', 5000)
        .end()
  }
};

