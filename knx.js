var knx = require('knx')
var connection = new knx.Connection( {
  // KNX 路由器或接口的 ip 地址和端口
  ipAddr: '192.168.1.151',
  ipPort: 3671,
  // 如果你需要指定多播接口（比如你有多个）
  interface: 'eth0',
  // 我们想使用的 KNX 物理地址
  physAddr: 'DO-76-50-00-11-F2',
 // 设置打印在控制台上的消息的日志级别。这可以是 'error', 'warn', 'info' （默认）、“调试”或“跟踪
  loglevel: 'info',
    // 不自动连接，而是使用 connection.Connect() 建立连接
  manualConnect: true,  
   // 使用多播（路由器）隧道 - 并非所有路由器都支持！请参阅 README-resilience.md 
  forceTunneling: true,
  // 在每个数据报之间至少等待 10 毫秒
  minimumDelay: 10,
  // 启用此选项以抑制带有传出 L_Data.req 请求的确认标志。LoxOne 需要这个
  suppress_ack_ldatareq: false,
    // 14/03/2020 在隧道模式下，通过发出新的 emitEvent 来回显发送的消息，因此具有相同组地址的其他对象可以接收发送的消息。默认为假
  localEchoInTunneling:false,
// 在此处定义您的事件处理程序：
  handlers: {
    // 在发送任何内容之前等待连接建立！
    connected: function() {
      console.log('建立连接成功!');
      // 向 DPT1 组地址连接写入任意布尔请求
      connection.write("0/0/5", 1);
       // 您还可以写入显式数据点类型，例如。DPT9.001 是温度摄氏度
      connection.write("2/1/0", 22.5, "DPT9.001");
      // 您也可以发出 READ 请求并传递回调以捕获响应
      connection.read("1/0/1", (src, responsevalue) => {  });
    },
    // 获得所有 KNX 事件的通知：
    event: function(evt, src, dest, value) { console.log(
        "event: %s, src: %j, dest: %j, value: %j",
        evt, src, dest, value
      );
    },
     // 收到连接错误通知
    error: function(connstatus) {
      console.log("**** ERROR: %j", connstatus);
    }
  }
});

// 声明一个简单的二进制控制数据点
var binary_control = new knx.Datapoint({ga: '1/0/1', dpt: 'DPT1.001'});
// 将其绑定到活动连接
binary_control.bind(connection);
// 将新值写入总线
binary_control.write(true); // or false!
// 发送读取请求，并在响应时触发回调
binary_control.read( function (response) {
    console.log("KNX response: %j", response);
  });
// 或声明调光器控件
var dimmer_control = new knx.Datapoint({ga: '1/2/33', dpt: 'DPT3.007'});
// 声明二进制 STATUS 数据点，该数据点将自动读出其值
var binary_status = new knx.Datapoint({ga: '1/0/1', dpt: 'DPT1.001', autoread: true});

// 数据点需要绑定到连接。这可以在他们创建时完成，也可以使用他们的bind()调用来完成。重要的是要强调在开始定义数据点（以及我们稍后将看到的设备）之前，您的代码 需要确保连接已建立，通常通过在“已连接”处理程序中声明它们：
var connection = knx.Connection({
  handlers: {
    connected: function() {
      console.log('----------');
      console.log('Connected!');
      console.log('----------');
      var dp = new knx.Datapoint({ga: '1/1/1'}, connection);
      // 现在发送几个请求:
      dp.read((src, value) => {
        console.log("**** RESPONSE %j reports current value: %j", src, value);
      });
      dp.write(1);
    }
  }
});
// 声明您的设备
// 您可以定义一个设备（基本上是一组与物理 KNX 设备相关的 GA，例如二进制开关），以便您拥有更高级别的控制
var light = new knx.Devices.BinarySwitch({ga: '1/1/8', status_ga: '1/1/108'}, connection);
console.log("The current light status is %j", light.status.current_value);
light.control.on('change', function(oldvalue, newvalue) {
  console.log("**** LIGHT control changed from: %j to: %j", oldvalue, newvalue);
});
light.status.on('change', function(oldvalue, newvalue) {
  console.log("**** LIGHT status changed from: %j to: %j", oldvalue, newvalue);
});
light.switchOn(); // 或 switchOff();
// 写入原始缓冲区
// 如果您自己对值进行编码，则可以使用writeRaw(groupaddress: string, buffer: Buffer, bitlength?: Number, callback?: () => void).

// 第三个（可选）参数bitlength对于位长不等于缓冲区字节长度 * 8 的数据点类型是必需的。dpt 1（位长 1）、2（位长 2）和 3（位长 4）就是这种情况。对于其他 dpts，该参数可以省略。
// 将原始缓冲区写入 dpt 1 的组地址（例如，亮起 = 值 true = Buffer<01>），位长为 1
connection.writeRaw('1/0/0', Buffer.from('01', 'hex'), 1)
// 将原始缓冲区写入 dpt 9 的组地址（例如温度 18.4 °C = 缓冲区<0730>），无位长度
connection.writeRaw('1/0/0', Buffer.from('0730', 'hex'))

// 断开
// 为了彻底断开连接，您必须发送 Disconnect-Request 并给 KNX-IP-Stack 足够的时间来接收来自 IP 网关的 Disconnect-Response。大多数 IP 网关都会有一个超时和干净的陈旧连接，即使您没有完全断开连接，但取决于并行活动连接数的限制，这将限制您重新连接的能力，直到超时过去。

// 为了在脚本退出时清理 NodeJS，这需要async-exit-hook 之类的东西：
const exitHook = require('async-exit-hook');
exitHook(cb => {
  console.log('Disconnecting from KNX…');
  connection.Disconnect(() => {
    console.log('Disconnected from KNX');
    cb();
  });
});