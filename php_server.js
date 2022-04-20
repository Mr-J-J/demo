const { Socket } = require('dgram');
const net = require( 'net' );
var port = 8000;
var hostname = '127.0.0.1';

// 定义两个变量， 一个用来计数，一个用来保存客户端
let clients = {};
let clientName = 0;

const server = new net.createServer();

server.on('connection', (client) => {
  client.name = ++clientName; 
  clients[client.name] = client; 

  client.on('data', function (msg) { 
    console.log(`消息${client.name}发来一个信息：${msg}`);
    client.write(msg);
  });

  client.on('error', function (e) {
    console.log('client error' + e);
    client.end();
  });

  client.on( 'close', function () {
    delete clients[client.name];
    console.log(`${ client.name }下线了`);
  });

});

server.listen( port,hostname,function () {
  console.log(`php_server：http://${hostname}:${port}`);
});
