module.exports = class WaitTestEvent {
  command(testSyncClient, testcase, eventname, cb) {
    return new Promise((resolve)=>{
      process.nextTick(()=>{
        testSyncClient.event(testcase, eventname)
        resolve()
      })
    })
  }
}
