/*
 * @Author: UpYou
 * @Date: 2020-12-25 9:14:50
 * @LastEditTime: 2020-12-29 16:09:04
 * @Description: uni.socket plug-in is developed based on uniapp...
 */

export default class Socket {
	constructor(option = {}) {
		this._url = option.url;
		// 是否设置重新连接
		this._reconnection = option.reconnection || true;
		// 是否建立缓存池,默认true，如果建立缓存池，会将因为程序错误导致未发送成功的消息发送
		this._buffer = option.buffer || true;
		/// on方法注册的事件
		this.on_register = {};
		// 是否已成功连接
		this._connectioned = false;
		// 缓存池
		this._buffer_register = [];
		// 发送缓存池的数据
		this._auto_emit_buffer_data = option.autoEmitBuffer || false;
		// 被动断开
		this.closed = false;
		// 开始重连
		this.begin_reconnection = false;
		// 多少毫秒发送一次心跳
		this._heart_rate = option.heartRate > 0 ? option.heartRate : 60000;
		// 后端心跳字段
		this._heart_rate_type = option.heartRateType || 'HEARTBEAT';
		this.init();
	}

	/**
	 * 注册一个事件
	 * @param {Object} event	事件
	 * @param {Object} handler 事件处理者
	 * @param {Boolean} single 此handler是否只处理一次
	 */
	async on(event, handler, single = false) {
		const eType = await this.getType(event);
		if (eType === "[object String]" && eType.trim() !== "") {
			let isSingle = true;
			if (single && this.on_register[event] !== undefined) {
				for (let i = 0; i < this.on_register[event].length; i++) {
					if (handler === handlers[i]) {
						isSingle = false;
						break;
					}
				}
			}
			if ((!single) || (isSingle && single)) { 
				if (this.on_register[event] === undefined) {
					this.on_register[event] = [];
				}
				this.on_register[event.trim()].push(handler);
			}
		}
	}

	/**
	 * 移除指定注册的事件
	 * @param {Object} name 事件名称
	 */
	async removeEventByName(name) {
		return Promise.then(() => {
			delete this.on_register[name]
		});
	}

	/**
	 * 给缓存池添加记录
	 */
	async addBuffer(data = {}) {
		const da = JSON.stringify(data);
		this._buffer_register.push(data);
	}

	/**
	 * 获取缓存池
	 */
	async getBuffer() {
		return this._buffer_register;
	}

	/**
	 * 获取连接状态
	 * @return {number} 0 表示连接中，1表示连接成功，2表示重连中，3表示失败
	 */
	async getState() {
		return this.begin_reconnection ? 2 : (this._connectioned ? 1 : (this.isError ? 3 : 0))
	}

	/**
	 * 关闭当前socket
	 */
	async close() {
		this.closed = true;
		this.SocketTask && this._connectioned && this.SocketTask.close();
	}

	/**
	 * 发送消息
	 */
	async emit(event, data = {}) {
		if (this.getType(event) === "[object Object]" && this.getType(event) === "[object String]") {
			let e = data;
			data = event;
			event = e;
		}
		if (this.SocketTask) {
			const da = {
				type: event,
				data: data
			};
			this.SocketTask.send({
				data: JSON.stringify(da),
				fail: (e) => {
					// 消息发送失败时将消息缓存
					this.addBuffer(da);
					throw new Error('Failed to send message to server... ' + e);
				}
			});
		} else {
			throw new Error("The socket is not initialization or connection error!");
		}
	}

	/**
	 * 将缓存池的数据发送
	 */
	async sendBufferRegister() {
		if (this._connectioned) {
			// 缓存池备份
			const backup = JSON.parse(JSON.stringify(this._bufer_register));
			let del_count = 0;
			for (var i = 0; i < backup.length; i++) {
				const buffer = backup[i - del_count];
				this.SocketTask.send({
					data: buffer,
					success: () => {
						backup.splice(i, 1);
						del_count++;
					}
				});
			}
			this._bufer_register = backup;
		}
	}
	/**
	 * 发生错误
	 * @param {Object} callback
	 */
	async error(err) {
		this.isError = true;
		if (this.on_register['error'] !== undefined) {
			this.invokeHandlerFunctionOnRegistr('error', err);
		}
	}

	/**
	 * 重新连接错误
	 * @param {Object} err 错误信息
	 */
	async reconnectionError(err) {
		this.isError = true;
		if (this.on_register['reconnectionerror'] !== undefined) {
			this.invokeHandlerFunctionOnRegistr('reconnectionerror', err);
		}
	}

	/**
	 * 连接成功
	 */
	async connectioned() {
		this.isError = false;
		// 关闭重连状态
		this.begin_reconnection = false;
		this._connectioned = true;
		if (this.on_register['connectioned'] !== undefined) {
			this.invokeHandlerFunctionOnRegistr('connectioned');
		}
		// 给服务器发送心跳
		this.beginSendHeartBeat();
	}

	/**
	 * 开始发送心跳
	 */
	async beginSendHeartBeat() {
		this._heart_rate_interval = setInterval(res => {
			this.emit(this._heart_rate_type);
			this.emitMessageToTargetEventByName('HEARTBEAT', {
				msg: 'Send a heartbeat to the server...'
			})
		}, this._heart_rate);
	}

	/**
	 * 将心跳结束
	 */
	async killApp() {
		this._heart_rate_interval && clearInterval(this._heart_rate_interval);
	}

	/**
	 * 重连socket
	 */
	async reconnection() {
		// 处于与服务器断开状态并且不是被动断开
		this._connectioned = false;
		if (!this.closed) {
			this.reconnection_time = setTimeout(() => {
				this.begin_reconnection = true;
				this.connection();
			}, 1000);
		}
	}

	/**
	 * 初始化程序
	 */
	async init() {
		this.connection();

		// 发送缓存池中的数据
		if (this._auto_emit_buffer_data) {
			setInterval(() => {
				this._connectioned && this.sendBufferRegister();
			}, 20000);
		}
	}

	/**
	 * 连接socket
	 */
	async connection() {
		// 是否有重连任务
		if (this.reconnection_time) {
			clearTimeout(this.reconnection_time);
		}
		/// 创建一个socket对象,返回socket连接
		const SocketTask = uni.connectSocket({
			url: this._url,
			success: () => {}
		});

		/// 打开连接的监听
		SocketTask.onOpen(() => {
			this.SocketTask = SocketTask;
			// 标记已成功连接socket
			this._connectioned = true;
			SocketTask.onClose(() => {
				// 重新连接
				if (!this.closed) {
					this.reconnection();
				}
			});
			this.connectioned();
		});

		SocketTask.onMessage((msg) => {
			try {
				const data = JSON.parse(msg.data);
				if (data['type'] && data['data']) {
					this.emitMessageToTargetEventByName(data['type'], data['data']);
				} else {
					this.emitToClientAllEvent(msg);
					this.emitToClientNotNameEvents(msg);
				}
			} catch (e) {
				/// 服务器发来的不是一个标准的数据
				this.emitToClientNotNameEvents(msg);
			}
		});

		/// 连接打开失败
		SocketTask.onError((res) => {
			// 不在重连状态
			if (!this.begin_reconnection) {
				this.error(res);
			} else {
				this.reconnectionError(res)
			}
			// 重新连接
			this.reconnection();
		})
	}

	/**
	 * 注销监听
	 */
	off(event, handler) {
		const handlers = JSON.stringify(JSON.parse(this.on_register));
		for (let i = 0; i < handlers.length; i++) {
			if (handler === handlers[i]) {
				handlers.splice(i, 1);
			}
		}
		return this.off;
	}

	// async function handler

	/**
	 * 给指定的事件发送消息
	 * @param {Object} name 事件名称
	 */
	async emitMessageToTargetEventByName(name, data) {
		this.invokeHandlerFunctionOnRegistr(name, data);
	}

	/**
	 * 联系使用on(**)注册的事件
	 */
	async emitToClientNotNameEvents(msg) {
		this.invokeHandlerFunctionOnRegistr("**", msg);
	}

	/**
	 * 联系使用on(*)注册的事件
	 */
	async emitToClientAllEvent(data) {
		this.invokeHandlerFunctionOnRegistr("*", data);
	}

	/**
	 * 获取对象类型
	 * @param {Object} o 需要验证的对象
	 */
	async getType(o) {
		return Object.prototype.toString.call(o);
	}

	/**
	 * 给指定的事件发送数据
	 * @param {Object} register 事件
	 * @param {Object} data 需要发送的数据
	 */
	async invokeHandlerFunctionOnRegistr(register, data) {
		if (this.on_register[register] !== undefined) {
			const eventList = this.on_register[register];
			for (var i = 0; i < eventList.length; i++) {
				const event = eventList[i];
				event(data);
			}
		}
	}

}
