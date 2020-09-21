# 目的
下記のWebRTCによるチャットプログラムをnightwatchによるe2eテストを実施するためのサンプルコードです。  

https://github.com/mima3/webrtc_sample/tree/master/webrtc02

以下の記事の補足になります。  
https://qiita.com/mima_ita/items/40293bd80a497a209a89

# 実行手順
## 依存ファイルのインストール
下記のコマンドを実施してください。

```
npm install
```

このコマンドにより以下のモジュールをインストールします。

 - nightwatch
 - node-ipc

## Seleniumの動作環境を構築する
dockerを使用してseleniumが動作する環境を作成します。

```
docker run --name seleniumA -d -p 14444:4444 -p 15900:5900 -v /dev/shm:/dev/shm selenium/standalone-chrome-debug
docker run --name seleniumB -d -p 24444:4444 -p 25900:5900 -v /dev/shm:/dev/shm selenium/standalone-chrome-debug
```

## テストの実行
下記のコマンドを実行することにより

**ターミナルA**

```
cd webrtc02
node server.js
```

**ターミナルB**

```
cd webrtc02_test
./start_test.sh
```

このスクリプトではtest_sync_server.jsというプロセス間通信を行うサーバを起動したのちにnightwatchによるテストを実施します。  
nightwatchでは-eオプションを使用した場合に同時に子プロセスが動作してテストを開始するため、そのプロセス間の同期をとるためにnode-ipcを使用してプロセス間通信を行います。  
この例では、nightwatchのカスタムコマンドとしてsendTestEventとwaitTestEventを追加しています。  

sendTestEventでは発生したイベントを全てのプロセスで共有するためのコマンドです。  
waitTestEventでは特定のイベントが発生するまで待機します。指定したタイムアウト時間が経過した場合、エラーとなります　
