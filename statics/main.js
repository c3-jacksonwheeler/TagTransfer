const { ipcRenderer } = require('electron')

let url = 'http://localhost:8080/api/1/nypa/prod/VanityUrl?action=fetch'

// window.setTimeout(()=>{
// 	ipcRenderer.sendSync('requestData', {url})

// },1000)


// ipcRenderer.on('displayMessage', (event, data)=>{
// 	console.log(data);
// 	document.getElementById("con").innerHTML = JSON.stringify(data,undefined,3)

// })


window.onload = function(){
	window.tagConfigs = {from: new TagConfigManager("from"), to: new TagConfigManager("to")}


	// ipcRenderer.on('transferInfo', Transfer.receiveTransferInformation)


	// dummyDataStart();
	ipcRenderer.on('respondState',(event, state)=>{
		console.log(state)
		window.tagConfigs.from.assumeConfig(state.connection.from)
		window.tagConfigs.to.assumeConfig(state.connection.to)


		Transfer.updateFromState(state.transfer)


		// window.tagConfigs.from.updateConnection(state.from.conn)
		// window.tagConfigs.to.updateConnection(state.to.conn)

	})

	// console.log("abc")
	ipcRenderer.send('requestState',{})



	$("#transferStart").click(()=>{
		
		Transfer.requestTransfer();


	})

}


