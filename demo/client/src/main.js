import Vue from "vue";
import App from "./App";
import UniSocket from "../../../lib/uni.socket";

/// 初始化uni.socket
const socket = new UniSocket({
  /// 根据你环境进行修改ip
  url: "ws://192.168.0.100:1200",
});

/// 连接成功时将uni.socket实例绑定到Vue.prototype.$socket
socket.on("connectioned", function() {
  Vue.prototype.$socket = socket;
});

const myError = function(err) {
  console.log("连接错误");
}

/// 连接错误时发生
socket.on("error",myError , true);

try {
  setTimeout(()=> {
    /// 连接错误时发生
    socket.on("error", myError,  true).catch(console.error);
  }, 1000);
} catch(e) {
  console.log(e);
}



/// 监听心跳
socket.on('HEARTBEAT', function(data) {
  console.log(data);
})

/// 监听服务器所有消息
socket.on('*', function(data) {
  console.log(data);
})

/// uni.socket无法解析的数据（服务端未按照规定返回数据）
// socket.on('**', function(dirty) {
//   console.log('**dirty: ', dirty);
// })

Vue.config.productionTip = false;

App.mpType = "app";

const app = new Vue({
  ...App,
});
app.$mount();
