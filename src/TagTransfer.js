const { ipcMain } = require("electron");
const axios = require('axios');
const { TagConnection } = require('./TagConnection.js')

const _ = require("underscore")

//dont fetch these types, scary
let { BlackList, getTypeBlacklist } = require('./BlackList')
blacklist = getTypeBlacklist()


const useTestingWhitelist = false;
let testingWhitelist = []


const batchSize = 10000;
const tickDelay = 50;
class TransferManager {
	constructor(TransferState, startFrom=0, typesToFetch, fromConn, toConn, useDryRun=false, callback) {

		this.TransferState = TransferState;

		this.useDryRun = useDryRun;
		this.callback = callback;
		this.typesToFetch = typesToFetch;
		this.fromConn = fromConn;
		this.toConn = toConn;

		this.typeIndex = startFrom; 

		this.currentType = this.typesToFetch[this.typeIndex];
		this.done = false || (this.currentType == undefined);

		this.batch = 0;

		setTimeout(() => { this.tick() }, 0)


	}
	getDetails() {
		return {
			"type": this.currentType,
			"batch": this.batch,
			"index": this.typeIndex,
			"numTypes": this.typesToFetch.length,
			"batchSize": batchSize
		}
	}
	setupNextType() {
		this.typeIndex++;//this.typeIndex--;
		if (this.typeIndex < this.typesToFetch.length) {//if(this.typeIndex >= 0){//
			this.currentType = this.typesToFetch[this.typeIndex];
			this.batch = 0;

		}
		else {
			return false;
		}
		return true;
	}
	tick() {
		if (this.done) {
			this.callback();
			return;
		}
		this.TransferState.pushState();
		this.fetchBatch().then((results) => {
			let { objs, hasMore } = results;

			this.mergeBatch(this.useDryRun ? [] : objs).then((res) => {
				console.log("hasMore", hasMore, " count: ", objs ? objs.length : 0)
				if (!hasMore) {

					let hasMoreTypes = this.setupNextType();
					if (!hasMoreTypes) {

						this.callback()
						return;
					}
					else {
						setTimeout(() => { this.tick() }, tickDelay)// long delay between diff types
					}

				}
				else {
					this.batch++;
					setTimeout(() => { this.tick() }, 0) // short/no delay between batches

				}

			}).catch((err) => {
				console.log("Error during batch merge", err)
				//skip current type
				let hasMoreTypes = this.setupNextType();
				if (!hasMoreTypes) {
					this.done = true;
					this.callback()
					return;
				}
				setTimeout(() => { this.tick() }, 0)
			})




		}).catch((err) => {
			console.log("Failed in fetching batch", err)
		})
	}

	fetchBatch() {
		console.log("\nFetch Batch | Type: ", this.currentType, " batchNum: ", this.batch, ` status: ${this.typeIndex + 1} / ${this.typesToFetch.length}`)
		return new Promise((resolve, reject) => {
			this.fromConn.fetch(this.currentType, batchSize, this.batch * batchSize).then((data) => {
				console.log(this.currentType, " : ", data.count)
				let objs = data.objs || []

				this.processFetchedObjs(objs)

				// console.log("more: ", data.hasMore, objs.length)
				resolve({ objs: objs, hasMore: data.hasMore })




			}).catch(reject)
		})


	}
	mergeBatch(objs) {
		return new Promise((resolve, reject) => {
			this.toConn.mergeBatch(this.currentType, objs).then((data) => {
				console.log(this.currentType, " : ", data.stats)

				resolve(data.stats)




			}).catch(reject)
		})

		// return new Promise((resolve,reject)=>{
		// 	if(!objs || objs.length == 0){
		// 		resolve();
		// 	}
		// 	// console.log(objs)
		// 	resolve();
		// })
	}


	processFetchedObjs(objs) {

		_.each(objs, (obj) => {
			delete obj.version;
			if (obj.meta) {
				obj.meta.comment = "TT";
			}

		})
	}


}



class TagTransfer {
	constructor(TransferState, data) {
		this.TransferState = TransferState;

		this.config = data;

		//Setup and validate connections
		this.fromConn = TransferState.fromConn;//new TagConnection(data.configs[0])
		this.toConn = TransferState.toConn;//new TagConnection(data.configs[1])
		this.canceled = false;
		this.step = "Initial"
		this.TransferState.pushState()

		Promise.all([this.fromConn.validateConnection(), this.toConn.validateConnection()]).then(() => { this.letsGo() }).catch((err) => { console.log(err) })

	}
	letsGo() {
		if (this.canceled) {
			return;
		}
		this.step = "Getting Type List"
		this.TransferState.pushState()

		console.log("LETS GO: ", this.config)


		//Compare Persistable types between the two connections

		let requests = []
		requests.push(this.fromConn.performRequest('TagInfoCache', 'info', { "this": {} }))
		requests.push(this.toConn.performRequest('TagInfoCache', 'info', { "this": {} }))

		Promise.all(requests).then((results) => {
			this.step = "Filtering Type List"
			this.TransferState.pushState()

			// console.log(results);
			let fromTypes = results[0].data.mixinTypesByType['Persistable'];
			let fromTypeIds = _.pluck(fromTypes, 'typeName')

			let toTypes = results[1].data.mixinTypesByType['Persistable'];
			let toTypeIds = _.pluck(toTypes, 'typeName')

			let commonEntities = _.intersection(toTypeIds, fromTypeIds);

			let typesToProcess = _.difference(commonEntities, blacklist)
			

			// Apply whitelist and blacklist from config

			typesToProcess = _.difference(typesToProcess, this.config.blacklist)
			
			if(this.config.useWhitelist){
				typesToProcess = _.intersection(typesToProcess,this.config.whitelist)
			}

			//Need to return these back to the server to check if they are really 


			let typeStr = '['
			_.each(typesToProcess, (type) => {

				typeStr += type + ","
			})

			typeStr = typeStr.substring(0, typeStr.length - 1);//strip last comma
			typeStr += ']'


			let validationCode = `
				function validate(type){
					return !(type.isParametric()); // Parametric types cannot be fetched without a 500 error
				}

				var typesToProcess = ${typeStr};
				var out = [];
				for(var i = 0; i < typesToProcess.length; i++){
					out.push(validate(typesToProcess[i]));
				}
				out;
			`
			console.log("Sending Validation Request to from server")


			var validationRequest = this.fromConn.performRequest("JS", "exec", { "js": validationCode })

			validationRequest.then((response) => {
				// console.log("VALIDATED", response)

				let validationResults = JSON.parse(response.data)

				let typesToFetch = _.filter(typesToProcess, (type, i) => {
					return validationResults[i];
				})
				if (useTestingWhitelist) {
					typesToFetch = _.intersection(typesToFetch, testingWhitelist)
				}
				this.step = "Transferring"
				this.TransferState.pushState()
				this.manager = new TransferManager(this.TransferState, this.config.startFrom, typesToFetch, this.fromConn, this.toConn, this.config.useDryRun,() => {
					this.step = "Complete"
					console.log("Done!")
					this.done = true;
					this.TransferState.pushState()

				})

				// this.fetchTypes(typesToFetch);


			}).catch((err) => {
				console.log("Error performing type validation: ", err)
			})




		}).catch((err) => {
			console.log(err)
		})


	}
	fetchTypes(typeList) {
		if (this.canceled) {
			return;
		}
		let delayTime = 50;
		this.fetching = new TransferHelper(this.fromConn, typeList, () => {

			console.log("Done Fetching")
		})


	}
	getState() {
		return {
			"step": this.step,
			"progress": (this.step == "Transferring" && this.manager) ? this.manager.getDetails() : undefined
		}
	}
	static getStateDetails() {
		if (TagTransfer.inProgress()) {
			return TagTransfer.inst.getState()
		}
		else {
			return {}
		}
	}

	static inProgress() {
		if (TagTransfer.inst && !TagTransfer.inst.done) {
			return true
		}
		return false;
	}

	static beginTransfer(TransferState, data) {
		if (TagTransfer.inst) {
			TagTransfer.inst.canceled = true;
		}

		TagTransfer.inst = new TagTransfer(TransferState, data)



	}

}

module.exports = {
	TagTransfer
}