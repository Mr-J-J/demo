const express = require('express');
const path = require('path');
const { get } = require('http');
// 创建网站服务器
const app = express();

app.use(express.static(path.join(__dirname, '/projects')));
// 监听端口
app.get('/', function (req, res) {
    res.sendFile( __dirname + "/public/" + "index.html" );
 })
 app.get('/index', function (req, res) {
    res.sendFile( __dirname + "/public/" + "index.html" );
 })
app.listen(8081);
console.log('网站服务器启动成功');