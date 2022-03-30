const axios = require('axios');
const { TagValidator, fixHost } = require('./TagValidator.js')

const _ = require("underscore")


/*

Config {
	host: rawHostString,
	tenant: string,
	tag: string,
	token: string
}

*/

class TagConnection {
	constructor(config, TransferState) {
		this.TransferState = TransferState;
		this.updateConfig(config);

	}
	serialize() {
		return {
			host: this.host,
			tenant: this.tenant,
			tag: this.tag,
			token: this.token,
			username: this.username,
			password: this.password,
			connected: this.connected,
			connectionStatus: this.connectionStatus

		}
	}

	updateConfig(config) {
		this.config = config;

		this.host = config.host ? fixHost(config.host) : "";
		this.tenant = config.tenant || "";
		this.tag = config.tag || "";
		this.token = config.token || "";
		this.username = config.username || "";
		this.password = config.password || "";
		this.connected = false;
		this.connectionStatus = {}

		if (this.host && this.tenant && this.tag && (this.token || (this.username && this.password))) {
			this.configSet = true;

			this.validateConnection();
		}
		else {
			this.configSet = false;
		}

	}

	fetch(type, options, limit = 2000, offset = 0) {
		if (!this.connected || !this.configSet) {

			throw "Not connected yet"
		}
		return new Promise((resolve, reject) => {
			
			console.log(options);
			 
			let fetchSpec = { "limit": limit, "offset": offset }
			
			if(options.isExtendable){
				fetchSpec.filter = `typeIdent == '${options.typeIdent}'`;
			}

			this.performRequest(type, 'fetch', { "spec": fetchSpec }).then((results) => {
				// console.log("FETCHED", results);
				resolve(results.data)
			}).catch((err) => {
				console.log("err", err);
				resolve({ status: "error", err })
			})

		})

	}
	mergeBatch(type, objs) {
		if (!this.connected || !this.configSet) {
			throw "Not connected yet"
		}
		return new Promise((resolve, reject) => {

			this.performRequest(type, 'mergeBatch', { "objs": objs }).then((results) => {
				resolve(results.data)
			}).catch(reject)
		})
	}
	performRequest(typeStr, action, payload) {
		if (!this.connected || !this.configSet) {

			throw "Not connected yet"
		}

		let url = `${this.host}/api/1/${this.tenant}/${this.tag}/${typeStr}?action=${action}`
		let headers = {
			Cookie: `c3auth=${this.token}; c3tenant=${this.tenant}; c3tag=${this.tag}`
		}

		console.log("Sending request to - ", url)

		return axios.post(url, payload || {}, { headers })

	}
	validateConnection() {
		TagValidator.validate(this.config).catch((err) => { console.log(this.which, err) }).then((res) => {
			// console.log(Object.keys(res))
			this.connectionStatus = res;
			if (res && res.status == "good") {
				this.connected = true;
				console.log("Connected ", res.code)

			}
			else {
				console.log("Bad connection: ", res.code)
				this.connected = false;

			}
			this.TransferState.pushState()

		});
	}
}
module.exports = {
	TagConnection
}
