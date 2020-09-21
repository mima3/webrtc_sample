module.exports = class WaitTestEvent {
  command(testSyncClient, testcase, eventname, ms, cb) {
    return testSyncClient.waitEvent(testcase, eventname, ms);
  }
}
