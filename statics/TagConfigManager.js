
class TagConfigManager {
	constructor(which) {
		if (which != "to" && which != "from") {
			throw "Invalid TagConfigManager constructor, " + which + " expecting 'to' or 'from'"
		}
		this.isTo = (which == 'to')
		this.isFrom = !this.isTo;
		this.prefix = which;
		this.locked = false;
		this.connectedStatus = false;


		//setup listeners

		this.hostInput = $(`#${this.prefix}_host`);
		this.tenantInput = $(`#${this.prefix}_tenant`);
		this.tagInput = $(`#${this.prefix}_tag`);
		this.tokenInput = $(`#${this.prefix}_token`);

		this.validateContainer = $(`#${this.prefix}_validate`);

		this.hostValue = this.hostInput.val()
		this.hostInput.change(() => {
			if (this.locked) {
				return;
			}
			let host = this.hostInput.val()
			this.hostValue = host;

			console.log("Host: ", host);
			this.performValidation();
		});

		this.tenantValue = this.tenantInput.val()
		this.tenantInput.change(() => {
			if (this.locked) {
				return;
			}
			let tenant = this.tenantInput.val()
			this.tenantValue = tenant;
			console.log("Tenant: ", tenant);
			this.performValidation();
		});
		this.tagValue = this.tagInput.val()
		this.tagInput.change(() => {
			if (this.locked) {
				return;
			}
			let tag = this.tagInput.val()
			this.tagValue = tag;
			console.log("Tag: ", tag);
			this.performValidation();
		});
		this.tokenValue = this.tokenInput.val()
		this.tokenInput.change(() => {
			if (this.locked) {
				return;
			}
			let token = this.tokenInput.val()
			this.tokenValue = token
			console.log("Token: ", token);
			this.performValidation();
		});




		// ipcRenderer.on('validationResponse_' + this.prefix, (event, data)=>{
		// 	if(this.locked){
		// 		return;
		// 	}
		// 	if(data.status == "bad"){
		// 		this.connectedStatus = false;
		// 	}
		// 	else{
		// 		this.connectedStatus = true;
		// 	}

		// 	let conn = this.connectedStatus?"Connected":("Unconnected : " +  data.statusText)
		// 	this.validateContainer[0].innerHTML = `<div class="ValidationContainer_${conn}">${conn}</div>`



		// 	console.log(data);
		// 	document.getElementById("con").innerHTML = JSON.stringify(data,undefined,3)

		// })



	}
	getConfig() {
		return {
			host: this.hostValue,
			tenant: this.tenantValue,
			tag: this.tagValue,
			token: this.tokenValue,
			which: this.prefix
		}
	}
	lock() {
		this.locked = true;

		this.hostInput.prop('disabled', true);
		this.tenantInput.prop('disabled', true);
		this.tagInput.prop('disabled', true);
		this.tokenInput.prop('disabled', true);

		$(`#${this.prefix}InputBlock`).show()

	}
	unlock() {
		this.locked = false;

		this.hostInput.prop('disabled', false);
		this.tenantInput.prop('disabled', false);
		this.tagInput.prop('disabled', false);
		this.tokenInput.prop('disabled', false);

		$(`#${this.prefix}InputBlock`).hide()
	}
	assumeConfig(data) {
		// if(this.locked){
		// 	return;
		// }
		this.hostInput.val(data.host);
		this.hostValue = data.host;

		this.tenantInput.val(data.tenant);
		this.tenantValue = data.tenant;

		this.tagInput.val(data.tag);
		this.tagValue = data.tag;

		this.tokenInput.val(data.token);
		this.tokenValue = data.token;



		if (data.connected) {
			let conn = "Connected"
			this.validateContainer[0].innerHTML = `<div class="ValidationContainer_Connected">${conn}</div>`
		}
		else {
			let conn = data.connectionStatus.code || "Unconnected"
			this.validateContainer[0].innerHTML = `<div class="ValidationContainer_Unconnected">${conn}</div>`

		}





		// console.log(data);
		// document.getElementById("con").innerHTML = JSON.stringify(data,undefined,3)


		// this.performValidation();
	}
	// updateConnection(conn){
	// 	if(conn == undefined){
	// 		this.validateContainer[0].innerHTML = ``
	// 	}
	// }

	performValidation() {
		if (this.locked) {
			return;
		}
		if (this.tokenValue && this.hostValue && this.tagValue && this.tenantValue) {
			//attempt login
			// console.log("Validating Tag Access for - ", this.prefix)
			let config = this.getConfig();
			// config.respondTo = 'validationResponse_' + this.prefix
			ipcRenderer.send('submitTagConfig', config)


		}
	}
}