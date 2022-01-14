const { ipcRenderer } = require('electron')


window.onload = function () {
	// Set up From and To components
	window.tagConfigs = { from: new TagConfigManager("from"), to: new TagConfigManager("to") }

	// When the server sends us an update on the Transfer Status, perform the following..
	ipcRenderer.on('respondState', (event, state) => {
		console.log(state)
		window.tagConfigs.from.assumeConfig(state.connection.from)
		window.tagConfigs.to.assumeConfig(state.connection.to)

		Transfer.updateFromState(state.transfer)

	})
	
	// Request a state update from the server to populate the UI on initial load
	ipcRenderer.send('requestState', {})
	ipcRenderer.send('requestConnectionUpdate', {})

	// Keep checking connection to the To/From environments to display in the UI
	window.setInterval(()=>{
		ipcRenderer.send('requestConnectionUpdate', {})
	},20000)

	$("#transferStart").click(() => {

		Transfer.requestTransfer();

	})

}