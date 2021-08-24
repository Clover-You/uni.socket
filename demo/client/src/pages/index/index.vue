<template>
  <view class="content">
    <div class="msg-box">
      <div v-for="(item, index) in list" :key="index">
        服务器消息：{{ item.msg }}
      </div>
    </div>
    <input placeholder="输入消息" v-model="msg" class="message-box box" />
    <div class="bottom">
      <button @click="sendData" class="box">发送文本框数据</button>
      <button @click="sendDirty" class="box">接收脏数据</button>
    </div>
  </view>
</template>

<script>
export default {
  data() {
    return {
      title: "Hello",
      msg: "",
      list: [],
    };
  },
  onLoad() {
    this.$socket.on('reply-success-hello', this.reply);
  },
  onUnload() {
    this.$socket.off('reply-success-hello', this.reply)
  },
  methods: {
    reply(data) {
      this.list.push(data)
      console.log('reply: ', data);
    },
    /// 发送数据到服务端
    sendData() {
      this.$socket.emit('hello', {msg: this.msg})
    },
    /// 通知服务端发送脏数据
    sendDirty() {
      this.$socket.emit('dirty-data', {})
    },
  },
};
</script>

<style>
.bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.box {
  height: 80rpx;
  padding: 0 20rpx;
  background-color: #fff;
  border-radius: 10rpx;
  border: 1px solid #bababa;
}

.message-box {
  flex: 1;
  margin-right: 30rpx;
}

.content {
  padding: 30rpx;
  bottom: 0;
  display: flex;
  width: 750rpx;
  flex-direction: column;
  box-sizing: border-box;
}

.msg-box {
  flex: 1;
  height: max-content;
  height: 1024rpx;
}
</style>
