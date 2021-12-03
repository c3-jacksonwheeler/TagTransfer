const { ipcRenderer } = require('electron')

let url = 'http://localhost:8080/api/1/nypa/prod/VanityUrl?action=fetch'

// window.setTimeout(()=>{
// 	ipcRenderer.sendSync('requestData', {url})

// },1000)


// ipcRenderer.on('displayMessage', (event, data)=>{
// 	console.log(data);
// 	document.getElementById("con").innerHTML = JSON.stringify(data,undefined,3)

// })

/*
{
		host:"https://nypa-em-stage-sdl.c3iot.ai/",
		tenant:"nypa",
		tag:"prod",
		token:"303366d1c4cea74adf4ec9604328a0a4ad379de867eb0543e0d5861c6fd9bcf73ddb01c4ff407135ba7a8e77277685dc571d25bead68e463ba557121eebf8aefa5ed",
	},

*/


// function dummyDataStart(){
// 	let configs = [
// 	{
// 		host:"https://nypa-em-predev.c3.ai/",
// 		tenant:"nypa",
// 		tag:"prod",
// 		token:"303328f5bed9e1420e9ff458247696bff39e74cf717d778a5ebd76800870a52c68a4e0f1008be55d841acda7a52ef12128aa4f7e19038f363b7f6e0f2d029dcaef6c",
// 	},

// 	{
// 		host:"localhost:8080",
// 		tenant:"nypa",
// 		tag:"prod",
// 		token:"3033ca98c6771f10ee5a566b9908f06543705eecba9260189890b4f7638bdb1b0031"

// 	}]

// 	tagConfigs[0].assumeConfig(configs[0])
// 	tagConfigs[1].assumeConfig(configs[1])


// }


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



