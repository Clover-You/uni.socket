import Vue from "vue";
import App from "./App";
import UniSocket from 'ctong-uni.socket'

const socket = new UniSocket({
  url: 'ws://192.168.21.133:1200',
  heartRate: 2000
})

socket.on('connectioned', function() {
  console.log('连接成功～～');
})

socket.on('connectioned', function() {

}, true);

socket.on('HEARTBEAT', function(data) {
  console.log('HEARTBEAT: ', data);
})

socket.on("*", function({data}) {
  if (data.type === 'HEARTBEAT') {
    console.log(data); 
  }
})

socket.on("**", function(data) {
  console.log("接到脏数据：", data);
})


Vue.prototype.$socket = socket;


Vue.config.productionTip = false;

App.mpType = "app";

const app = new Vue({
  ...App,
});
app.$mount();
