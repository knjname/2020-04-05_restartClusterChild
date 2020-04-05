const cluster = require("cluster");
const http = require("http");

const sleep = time => new Promise(done => setTimeout(done, time));

const clusterCount = 4;
const portNumber = 10080;

if (cluster.isMaster) {
  const spawnProcess = () => {
    // プロセスを終了させるまでの時間: 0 〜 5000 msec
    const ttl = ~~(5000 * Math.random());
    const child = cluster.fork();
    let timeout;

    child.on("listening", () => {
      // 指定時間で終了(Graceful kill)させる
      console.log(`誕生！ 死まで ${ttl} msec.`);
      timeout = setTimeout(() => {
        console.log(`死: ${child.id}`);
        child.kill();
      }, ttl);
    });
    child.on("disconnect", () => {
      // 別の理由で死んだ場合はkillをキャンセル
      if (timeout) {
        clearTimeout(timeout);
      }
    });
    child.on("exit", () => {
      // 子プロセスが終了したら代わりのものを1つ起動する
      spawnProcess();
    });
  };

  // 子プロセスを複数起動する
  for (let i = 0; i < clusterCount; i++) {
    spawnProcess();
  }
}
if (cluster.isWorker) {
  // Express や Koa など好きに使いましょう
  http
    .createServer(async (req, res) => {
      // リクエスト終了までやや時間がかかる設定
      await sleep(1000);
      res.writeHead(200);
      res.end("Request done\n");
    })
    .listen(portNumber);
}
