const { ipcMain } = require("electron");
const { TagConnection } = require('./TagConnection.js')
const { TagTransfer } = require('./TagTransfer.js')

const startWithTestData = true;

//static 
class TransferState {

	static toConn; // "TO" connection
	static fromConn; // "FROM" connection
	static nextReplyEvent;

	static ipcMain; // the inter-process communication variable

	// Stateful variables: 
	static isTransfering; // whether the application is transferring information
	

	constructor() {
		throw "Dont instantiate this"
	}
	static getConnectionState() {
		return {
			to: TransferState.toConn.serialize(),
			from: TransferState.fromConn.serialize()
		}
	}
	static getTransferState() {
		return {
			inProgress: TagTransfer.inProgress(),
			readyToStart: TransferState.toConn.connected && TransferState.fromConn.connected && !TagTransfer.inProgress(),
			details: TagTransfer.getStateDetails()
		}
	}
	static pushState() {	
		if (TransferState.nextReplyEvent) {
			TransferState.nextReplyEvent.reply('respondState', TransferState.getState())
		}
	}

	static getState() {
		return {
			connection: TransferState.getConnectionState(),
			transfer: TransferState.getTransferState()
		}
	}

  static receiveTypelistRequest(event, data){
    if (!TransferState.getTransferState().inProgress){
			TagTransfer.getTypeList();
		}
  }
  
	static receiveTransferRequest(event, data) {
		if (TransferState.getTransferState().readyToStart) {
			TagTransfer.beginTransfer(TransferState, data)
		}
	}
	static receiveConnectionUpdate(event, data){
		TransferState.toConn.validateConnection()
		TransferState.fromConn.validateConnection()
	}
	static receiveTagConfig(event, config) {
		console.log("Receive Tag Config: ", config)

		if (config.which == "from") {
			TransferState.fromConn.updateConfig(config);
		}
		else {
			TransferState.toConn.updateConfig(config);
		}

	}
	static sendState(event, data) {
		console.log("Renderer requested config state")
		TransferState.nextReplyEvent = event;

		event.reply('respondState', TransferState.getState())
	}

	static setup() {
		console.log("setup");
		const { testData } = require("../testData2.js");

		TransferState.ipcMain = ipcMain;

		TransferState.startListeners();

		TransferState.isTransfering = false;
		TransferState.fromConn = new TagConnection(startWithTestData ? testData.fromConfig : {}, TransferState);
		TransferState.toConn = new TagConnection(startWithTestData ? testData.toConfig : {}, TransferState);

		TagTransfer.initiateTransferObj({fromConn: TransferState.fromConn, toConn: TransferState.fromConn});
	}

	static startListeners() {

		ipcMain.on('requestConnectionUpdate', TransferState.receiveConnectionUpdate);

		ipcMain.on('submitTagConfig', TransferState.receiveTagConfig);

		//respondTypelistRequest
		ipcMain.on('requestTypelist', TransferState.receiveTypelistRequest);

		//respondTransferRequest
		ipcMain.on('requestTransfer', TransferState.receiveTransferRequest);

		//respondConfigState
		ipcMain.on('requestState', TransferState.sendState);

	}

}

module.exports = {
	TransferState
}
