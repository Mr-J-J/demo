var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var knx = require('knx');
const exitHook = require('async-exit-hook');
var logger = require('./log/index');
const path = require('path');
const recording = require('log4js/lib/appenders/recording');
// 格式化时间

function timetostr(nTimeStamps) {
  //转毫秒
  var date = new Date(nTimeStamps);
  //时间字符串
  var timeString = date.getFullYear() + "-" +
      (date.getMonth() + 1) + "-" +
      date.getDate() + " " +
      date.getHours() + ":" +
      date.getMinutes() + ":" +
      date.getSeconds() + ":" +
      date.getMilliseconds();
  return '['+timeString+']';
}

// 整体序号计数
num_n=0;
function numer(){
  if(num_n<100000){
    ++num_n;
  }else{
    num_n=0;
  }
  return padding1(num_n,5);
}
// 初始化数字
function padding1(num, length) {
  for(var len = (num + "").length; len < length; len = num.length) {
      num = "0" + num;            
  }
  return num;
}
var left = false;
var right = false;
// 发送命令
// 设置设备ip
let KNX_IP = "192.168.1.150";
  // 创建实例化设备
knxConnection = new knx.Connection({
      ipAddr: KNX_IP,
      ipPort: 3671,
      loglevel: 'info',
      
      handlers: {
        // 连接
          connected: function () {
            // 成功后trace日志已连接
              logger.trace("设备已连接");
              // 读取节点信息
              knxConnection.read('0/0/6', function (response, value) {
                // 输出节点信息
                  logger.trace(value);
                  // 左灯控制
                  // 左灯群组地址为0/0/5右灯为0/0/8
                  // DPT1.001为开关节点
                  var binary_control = new knx.Datapoint({
                      ga: '0/0/5',
                      dpt: 'DPT1.001'
                  });
                  // 设备绑定实例化knx对象
                  binary_control.bind(knxConnection);
                  // 读取设备状态
                  binary_control.read(function(a,v){
                    left = v;
                });
                  // 1秒发一次信息
                    setInterval(() =>{ 
                      binary_control.write(left);
                      binary_control.read(function(a,v){
                          logger.trace(v);
                      })
                    }, 5000);
                    // 右灯控制
                    // 左右灯循环发送
                    var binary_control_right = new knx.Datapoint({
                      ga: '0/0/8',
                      dpt: 'DPT1.001'
                  });
                  binary_control_right.bind(knxConnection);
                  binary_control_right.read(function(a,v){
                    right = v;
                })
                    setInterval(() =>{ 
                      binary_control_right.write(right);
                      binary_control_right.read(function(a,v){
                          logger.trace(v);
                      })
                    }, 5000);
              });
              // 退出断开连接
              exitHook(cb => {
                  logger.trace('正断开设备连接');
                  knxConnection.Disconnect(() => {
                    logger.trace('断开设备连接');
                    cb();
                  });
              });
        },
          
          // 所有事件通知
          // event: function(evt, src, dest, value) { console.log(
          //     "event: %s, src: %j, dest: %j, value: %j",
          //     evt, src, dest, value
          //   );
          // },
          
          // 收到连接错误通知
          error: function(connstatus) {
            logger.error("**** ERROR: %j", connstatus);
          }
          
      },
      
  });
  // 使用中间件，把public空间内设置可访问
app.use('/',express.static(path.join(__dirname,'/public')));
// 路由设置主地址访问/public/index.html
app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});
// 监听socket
io.on('connection', function(socket){
  // 连接后给客户端广播左灯右灯状态，让其根据状态改变按钮样式
  io.emit('chat message', 'l-'+String(left));
  io.emit('chat message', 'r-'+String(right));

  // 广播已连接成功
  logger.info("["+numer()+"]-"+'连接成功');
  var events = recording.replay();
  msg_true=timetostr(events[0]['startTime'])+'-'+events[0]['data'];
  var events = recording.reset();
  io.emit('chat message', '-'+msg_true);

  // 监听socket消息
  socket.on('chat message', function(msg){
    // 查看接收到的消息相关指令并执行命令
    if(msg=='l-true'){
      left = true;
      logger.info("["+numer()+"]-"+'l-true');
      // 这里是获取log信息到变量里，付给msg_true，msg为命令信息，前端视图不可见，msg_true为log信息，前端视图可见
      var events = recording.replay();
      msg_true=timetostr(events[0]['startTime'])+'-'+events[0]['data'];
      var events = recording.reset();
    }
    if(msg=='l-false'){
      left = false;
      logger.info("["+numer()+"]-"+'l-false');
      // 这里是获取log信息到变量里，付给msg_true，msg为命令信息，前端视图不可见，msg_true为log信息，前端视图可见
      var events = recording.replay();
      msg_true=timetostr(events[0]['startTime'])+'-'+events[0]['data'];
      var events = recording.reset();
    }
    if(msg=='r-true'){
      right = true;
      logger.info("["+numer()+"]-"+'r-true');
      // 这里是获取log信息到变量里，付给msg_true，msg为命令信息，前端视图不可见，msg_true为log信息，前端视图可见
      var events = recording.replay();
      msg_true=timetostr(events[0]['startTime'])+'-'+events[0]['data'];
      var events = recording.reset();
    }
    if(msg=='r-false'){
      right = false;
      logger.info("["+numer()+"]-"+'r-false');
      // 这里是获取log信息到变量里，付给msg_true，msg为命令信息，前端视图不可见，msg_true为log信息，前端视图可见
      var events = recording.replay();
      msg_true=timetostr(events[0]['startTime'])+'-'+events[0]['data'];
      var events = recording.reset();
    }
    // 广播命令信息和Log信息
    io.emit('chat message', msg);
    io.emit('chat message', '-'+msg_true);
  });
});
// 开通监听端口3000
http.listen(3000, function(){
  console.log('127.0.0.1:3000');
});


