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

// function switchAuthType(from) {
// 	let tmpTxt = '';
// 	if (from){
// 		tmpTxt = 'from';
// 	} else {
// 		tmpTxt = 'to';
// 	}
// 	authDiv = $('#authentication');
// 	if (authDiv[0].innerHTML.indexOf('AuthToken') > 0){
// 		authDiv[0].innerHTML = `
// 		  <p> Username </p>
// 			<input type="text" class="FormInput" placeholder="BA" id="${tmpText}_username" ></input>
// 			<p> Password </p>
// 			<input type="text" class="FormInput" placeholder="BA" id="${tmpText}_password ></input>
// 		`
// 	} else {
		
// 		authDiv[0].innerHTML = `
// 			<input type="text" class="FormInput" placeholder="c3 AuthToken 2" id="${tmpTxt}_token">
// 		`
// 	}

// 	var tmp = authDiv.val;

// 	var a = 3;
	
// }