const { ipcMain } = require("electron");
const axios = require('axios');
const { TagConnection } = require('./TagConnection.js');
// const { TransferState } = require("./TransferState")

const _ = require("underscore");


//dont fetch these types, scary
let {  getTypeBlacklist } = require('./BlackList');
const { TransferState } = require("./TransferState.js");
var blacklist = getTypeBlacklist();

/*

How Transferring Works!
	Once a TagTTransfer instance has been created, the process begins.

	The new TagTransfer does the following
		1. Validates To and From environment connections
		2. Fetches a list of all types from each of the environments (TagInfoCache.info()) and filters out only the Persistable types[fromTypes, toTypes]
		3. Does an intersection on [fromTypes, toTypes] to get a list of Persistable types valid in both environments
		4. Applies a global blacklist to remove scary types, and unnecessary log types
		5. Apply user defined whitelist and blacklist
		6. Generate a script to be executed on the cluster to get extra info needed to process these types
			6a. Check if the type is Parametric type, (these cannot be fetched on without throwing a 500 error)
			6b. Check if the type is extendable, and if so, get the typeIdent, to avoid issues with Polymorphism
		7. Kick off a TransferManager on the final list of types + the extra info collected on them


	Once the TransferManager is kicked off, it does the following in a loop, 
	I've tried to keep the thread responsive to requests from the UI by using setTimeout, and to prevent stack overflow
		Tick() - Fetch a batch of a type
			1. if there is a hasMore flag on the fetch result, increase batchNum
			2. Else, setup next type and set batch to 0
			3. If no more types, callback to TagTransfer
*/

const useTestingWhitelist = false;
let testingWhitelist = []

const batchSize = 10000;
const tickDelay = 50;
class TransferManager {
	// constructor(TransferState, startFrom = 0, typesToFetch, typeInfoMap, fromConn, toConn, useDryRun = false, callback) {
	constructor(startFrom = 0, typesToFetch, typeInfoMap, fromConn, toConn, useDryRun = false, callback) {

		// this.TransferState = TransferState;

		this.useDryRun = useDryRun;
		this.callback = callback;
		this.typesToFetch = typesToFetch;
		this.typeInfoMap = typeInfoMap;
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
		// this.TransferState.pushState();
		// TransferState.pushState();
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
			this.fromConn.fetch(this.currentType, this.typeInfoMap.get(this.currentType), batchSize, this.batch * batchSize).then((data) => {
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
	static inst; // active instance of transfering data between tags
	
	constructor(connetions) {
		// this.TransferState = TransferState;
		this.config = 4;

		//Setup and validate connections
		this.fromConn = connetions.fromConn;//new TagConnection(data.configs[0])
		this.toConn = connetions.toConn;//new TagConnection(data.configs[1])
		this.canceled = false;
		this.done = false;
		this.isInProgress = false;
		this.step = "Initial"
    this.typesToFetch;
		this.typeInfoMap;
    this.blackList;
		
		// this.TransferState.pushState();
		// TransferState.pushState();
	}

	gatherTypeList(){
		if (this.canceled) {
			return;
		}
		this.step = "Getting Type List"; 
		// this.TransferState.pushState(); // communication between client and server regarding what's going on
		// TransferState.pushState(); // communication between client and server regarding what's going on
		console.log("Gathering Type List: ", this.config)


		//Compare Persistable types between the two connections
		let requests = []
		
		// 2a. Fetches a list of all types from each of the environments (TagInfoCache.info()) --
		requests.push(this.fromConn.performRequest('TagInfoCache', 'info', { "this": {} }))
		requests.push(this.toConn.performRequest('TagInfoCache', 'info', { "this": {} }))
		
		
		Promise.all(requests).then((results) => {
			this.step = "Filtering Type List"
			// this.TransferState.pushState();
			// TransferState.pushState();

			// 2b. -- and filter out only the Persistable types[fromTypes, toTypes]
			let fromTypes = results[0].data.mixinTypesByType['Persistable'];
			let fromTypeIds = _.pluck(fromTypes, 'typeName')

			let toTypes = results[1].data.mixinTypesByType['Persistable'];
			let toTypeIds = _.pluck(toTypes, 'typeName')
			
			

			// 3. Does an intersection on [fromTypes, toTypes] to get a list of Persistable types valid in both environments
			let commonEntities = _.intersection(toTypeIds, fromTypeIds);

			// 4. Applies a global blacklist to remove scary types, and unnecessary log types
      let typesToBlacklist = [];
      typesToBlacklist.push( ...(_.intersection(commonEntities, blacklist)));
			let typesToProcess = _.difference(commonEntities, blacklist);

			// 5. Apply user defined whitelist and blacklist
      typesToBlacklist.push(...(_.intersection(typesToProcess, this.config.blacklist)));
			typesToProcess = _.difference(typesToProcess, this.config.blacklist);
			if (this.config.useWhitelist) {
				typesToProcess = _.intersection(typesToProcess, this.config.whitelist);
			}

			//Need to return these back to the server to check if they are really 

			//6. Generate a script to be executed on the cluster to get extra info needed to process these types
			//	6a. Check if the type is Parametric type, (these cannot be fetched on without throwing a 500 error)
			//	6b. Check if the type is extendable, and if so, get the typeIdent, to avoid issues with Polymorphism
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
				function computeExtraInfo(type){
					var extraInfo = {};
					extraInfo.isExtendable = !!type.getTypeIdent;
					extraInfo.typeIdent = extraInfo.isExtendable ? type.getTypeIdent() : undefined;
					return extraInfo
				}
				var typesToProcess = ${typeStr};
				var out = [];
				for(var i = 0; i < typesToProcess.length; i++){
					var isValid = validate(typesToProcess[i])
					if(isValid){
						out.push(computeExtraInfo(typesToProcess[i]))
					}
					else{
						out.push(false)
					}
				}
				out;
			`
			console.log("Sending Validation Request to from server")

			var validationRequest = this.fromConn.performRequest("JS", "exec", { "js": validationCode })

			validationRequest.then((response) => {

				let validationResults = JSON.parse(response.data)

				let typeInfoMap = new Map();

				let typesToFetch = _.filter(typesToProcess, (type, i) => {
					let validationResult = validationResults[i]
					if (validationResult) {
						//save extra info into typeInfoMap
						typeInfoMap.set(type, validationResult);
						return true;
					}
					return false;
				});

				// Was only used for early development
				if (useTestingWhitelist) {
					typesToFetch = _.intersection(typesToFetch, testingWhitelist)
				}

				// 7. Store the type lists in the instance variable for future reporting
				this.typesToFetch = typesToFetch;
				this.typeInfoMap = typeInfoMap;
				this.blackList = typesToBlacklist;

			}).catch((err)=>{
				console.log('VALIDATION - Unable to validate ')
				console.log(err);
			});
		}).catch((err)=>{
			console.log('TAG CACHE - Unable to perform tag cache inquiry on the from/to environment');
			console.log(err);
		});
	}

	transferTypes() {
		this.step = "Transferring"
		// this.TransferState.pushState()
		// TransferState.pushState();

		if (this.typesToFetch && this.typeInfoMap){
			// 7. Kick off a TransferManager on the final list of types + the extra info collected on them
			// this.manager = new TransferManager(this.TransferState, this.config.startFrom, this.typesToFetch, this.typeInfoMap, this.fromConn, this.toConn, this.config.useDryRun, () => {
			this.manager = new TransferManager(this.config.startFrom, this.typesToFetch, this.typeInfoMap, this.fromConn, this.toConn, this.config.useDryRun, () => {
				this.isInProgress = false;
				this.step = "Complete"
				console.log("Done!")
				this.done = true;
				// TransferState.pushState();
			});
		}
	}

	letsGo() {
		if (this.canceled) {
			return;
		}
		this.step = "Getting Type List"
		// this.TransferState.pushState();
		// TransferState.pushState();

		console.log("LETS GO: ", this.config)


		//Compare Persistable types between the two connections

		let requests = []
		requests.push(this.fromConn.performRequest('TagInfoCache', 'info', { "this": {} }))
		requests.push(this.toConn.performRequest('TagInfoCache', 'info', { "this": {} }))
		// 2a. Fetches a list of all types from each of the environments (TagInfoCache.info()) --

		Promise.all(requests).then((results) => {
			this.step = "Filtering Type List"
			// TransferState.pushState();

			let fromTypes = results[0].data.mixinTypesByType['Persistable'];
			let fromTypeIds = _.pluck(fromTypes, 'typeName')

			let toTypes = results[1].data.mixinTypesByType['Persistable'];
			let toTypeIds = _.pluck(toTypes, 'typeName')
			// 2b. -- and filter out only the Persistable types[fromTypes, toTypes]

			// 3. Does an intersection on [fromTypes, toTypes] to get a list of Persistable types valid in both environments

			let commonEntities = _.intersection(toTypeIds, fromTypeIds);

			// 4. Applies a global blacklist to remove scary types, and unnecessary log types
      let typesToBlacklist = [];
      typesToBlacklist.push( ...(_.intersection(commonEntities, blacklist)));
			let typesToProcess = _.difference(commonEntities, blacklist);


			// 5. Apply user defined whitelist and blacklist
      typesToBlacklist.push(...(_.intersection(typesToProcess, this.config.blacklist)));
			typesToProcess = _.difference(typesToProcess, this.config.blacklist);

			if (this.config.useWhitelist) {
				typesToProcess = _.intersection(typesToProcess, this.config.whitelist);
			}

			//Need to return these back to the server to check if they are really 

			//6. Generate a script to be executed on the cluster to get extra info needed to process these types
			//	6a. Check if the type is Parametric type, (these cannot be fetched on without throwing a 500 error)
			//	6b. Check if the type is extendable, and if so, get the typeIdent, to avoid issues with Polymorphism

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
				function computeExtraInfo(type){
					var extraInfo = {};
					extraInfo.isExtendable = !!type.getTypeIdent;
					extraInfo.typeIdent = extraInfo.isExtendable ? type.getTypeIdent() : undefined;


					return extraInfo
				}

				var typesToProcess = ${typeStr};
				var out = [];
				for(var i = 0; i < typesToProcess.length; i++){
					var isValid = validate(typesToProcess[i])
					if(isValid){
						out.push(computeExtraInfo(typesToProcess[i]))
					}
					else{
						out.push(false)
					}
					
				}

				out;
			`
			console.log("Sending Validation Request to from server")


			var validationRequest = this.fromConn.performRequest("JS", "exec", { "js": validationCode })

			validationRequest.then((response) => {

				let validationResults = JSON.parse(response.data)

				let typeInfoMap = new Map();

				let typesToFetch = _.filter(typesToProcess, (type, i) => {
					let validationResult = validationResults[i]
					if (validationResult) {
						//save extra info into typeInfoMap
						typeInfoMap.set(type, validationResult);
						return true;
					}
					return false;
				});

				// Was only used for early development
				if (useTestingWhitelist) {
					typesToFetch = _.intersection(typesToFetch, testingWhitelist)
				}
        
				this.step = "Transferring"
				// TransferState.pushState()

				// 7. Kick off a TransferManager on the final list of types + the extra info collected on them
				this.manager = new TransferManager( this.config.startFrom, typesToFetch, typeInfoMap, this.fromConn, this.toConn, this.config.useDryRun, () => {
					this.step = "Complete"
					console.log("Done!")
					this.done = true;
					// TransferState.pushState()

				})

			}).catch((err) => {
				console.log("Error performing type validation: ", err)
			})

		}).catch((err) => {
			console.log(err)
		})


	}

	// fetchTypes(typeList) {
	// 	if (this.canceled) {
	// 		return;
	// 	}
	// 	let delayTime = 50;
	// 	this.fetching = new TransferHelper(this.fromConn, typeList, () => {

	// 		console.log("Done Fetching")
	// 	})
	// }

	getState() {
		return {
			"step": this.step,
			"progress": (this.step == "Transferring" && this.manager) ? this.manager.getDetails() : undefined,
			"typeList": this.typesToFetch
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
		if (TagTransfer.inst) {
			if (TagTransfer.inst.isInProgress && !TagTransfer.inst.done){
				return true;
			}
			return false;
		}
		return false;
	}

	static beginTransfer(TransferState, data) {
		// if (TagTransfer.inst) {
		// 	TagTransfer.inst.canceled = true;// Cancel running transfer if still in progress
		// }

		// TagTransfer.inst = new TagTransfer(TransferState, data)

		// 1. Validates To and From environment connections
		Promise.all([this.inst.fromConn.validateConnection(), this.inst.toConn.validateConnection()]).then(() => { 
			if (TagTransfer.inst){
				this.isInProgress = true;
				TagTransfer.inst.transferTypes()
			}
		}).catch((err) => { console.log(err) })
	}

	static getTypeList() {
		if (TagTransfer.inst){
			TagTransfer.inst.gatherTypeList();
		} else {
			console.log('Unable to gather type list, no Object innitiated');
		}
	}

	static initiateTransferObj(connections) {
		if (TagTransfer.inst) {
			TagTransfer.inst.canceled = true;
		}
		TagTransfer.inst = new TagTransfer(connections);
	}
}

// module.exports = {
// 	TagTransfer
// }
module.exports = {
	TagTransfer
}

