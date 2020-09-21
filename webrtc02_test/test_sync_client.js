const ipc=require('node-ipc');
module.exports = class TestSyncClient {
  constructor(id) {
    this.ipc = require('node-ipc')
    this.ipc.config.id = id
    this.ipc.config.retry = 1500
    //this.ipc.config.silent = true
    this.connected = false
    this.serverid = null
    this.events = [] 
    this.waitevents = []
  }
  connect(serverid, callback) {
    this.serverid = serverid
    const self = this
    this.ipc.connectTo(
      this.serverid,
      ()=> {
        self.connected = true
        self.ipc.of[serverid].on(
          'event',
          (data)=>{
            self.events.push(data)
            const waitevent = self.__containEvent(self.waitevents, data.testcase, data.eventname)
            if (waitevent) {
              // 待機中のイベントか確認する
              clearTimeout(waitevent.timerId)
              waitevent.resolve();
            }
          }
        )
        callback(self)
      }
    )
  }

  close() {
    this.ipc.disconnect(this.serverid)
  }

  event(testcase, eventname) {
    console.log('event')
    this.ipc.of[this.serverid].emit(
      'event',
      {
        from : this.ipc.config.id,
        testcase : testcase,
        eventname: eventname
      }
    )
  }
  waitEvent(testcase, eventname, timeout) {
    const self = this
    console.log('waitEvent', testcase, eventname, timeout)
    return new Promise((resolve, reject)=> {
      // timeoutの設定
      const timerId = setTimeout(()=>{
        console.log('***timeout')
        reject(new Error(`timeout ${testcase} ${eventname} ${timeout}`));
      }, timeout);
      // イベントが実行済みか確認
      if (self.__containEvent(self.events, testcase, eventname)) {
        console.log('find', testcase,eventname)
        process.nextTick(()=>{
          clearTimeout(timerId)
          resolve();
        })
      }
      else {
        self.waitevents.push({
          testcase : testcase,
          eventname : eventname,
          timerId : timerId,
          resolve : resolve
        })
      }
    })
  }
  __containEvent(events, testcase, eventname) {
    for(const event of events) {
      if(event.testcase === testcase &&
         event.eventname === eventname) {
        return event 
      }
    }
    return null;
  }
}
