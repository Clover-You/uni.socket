const net = require("net");
/**
 * <p>
 * █████▒█      ██  ▄████▄   ██ ▄█▀     ██████╗ ██╗   ██╗ ██████╗
 * ▓██   ▒ ██  ▓██▒▒██▀ ▀█   ██▄█▒      ██╔══██╗██║   ██║██╔════╝
 * ▒████ ░▓██  ▒██░▒▓█    ▄ ▓███▄░      ██████╔╝██║   ██║██║  ███╗
 * ░▓█▒  ░▓▓█  ░██░▒▓▓▄ ▄██▒▓██ █▄      ██╔══██╗██║   ██║██║   ██║
 * ░▒█░   ▒▒█████▓ ▒ ▓███▀ ░▒██▒ █▄     ██████╔╝╚██████╔╝╚██████╔╝
 * ▒ ░   ░▒▓▒ ▒ ▒ ░ ░▒ ▒  ░▒ ▒▒ ▓▒     ╚═════╝  ╚═════╝  ╚═════╝
 * ░     ░░▒░ ░ ░   ░  ▒   ░ ░▒ ▒░
 * ░ ░    ░░░ ░ ░ ░        ░ ░░ ░
 * ░     ░ ░      ░  ░
 * <p>
 * Copyright Copyright 2021 UpYou.
 * </p>
 *
 * @file: server.js
 * @description: un.socket 服务端示例
 * @version: v1.0
 * @create: 2021-04-29 14:42
 **/
const WebSocketServer = require("ws").Server;

const wss = new WebSocketServer({ port: 1200 }, function () {
  console.log("服务器在1200端口启动～");
});

/// 有客户端连接进来时触发
wss.on("connection", function (ws) {
  console.log("服务端：客户端已连接");
  /// 接收消息
  ws.on("message", handlerMessage);

  /// 根据类型处理客户端消息
  function handlerMessage(str) {
    /// uni.socket发送的数据是一个序列化过后的json，根据type字段进行解析类型
    const data = JSON.parse(str);
    /// 处理心跳
    if (data.type === "HEARTBEAT") {
      handlerHeartbeatEvent(data);
      return;
    }

    if (data['type'] != void 0) {
        /// 根据type匹配驱动
        events[data.type](data);
    }
  }

  /// 发送消息
  function send(event, data) {
      const str = {'type': event, data: data}
      ws.send(JSON.stringify(str));
  }

  /// 处理心跳
  function handlerHeartbeatEvent(data) {
    send('HEARTBEAT', "bobo～bobo～")
    // ws.send('{"type":"HEARTBEAT","data": "bobo～bobo～"}');
  }

  /// 驱动集
  const events = {
    "success-hello": function (data) {
      send('reply-success-hello', data.data)
    },
    "dirty-data": function(data) {
        const str = {'type': 'reply-dirty-data', dirtyData: data}
        ws.send(JSON.stringify(str));
    }
  };

});
