class Transfer{
	constructor(){
		//loc
		// this.done = false;

		// //lock controls
		// tagConfigs[0].lock()
		// tagConfigs[1].lock()

		// ipcRenderer.send('beginTransfer',
		// {
		// 	configs: [tagConfigs[0].getConfig(), tagConfigs[1].getConfig()]
		// })


	}
	// onComplete(){
		
	// 	tagConfigs[0].unlock()
	// 	tagConfigs[1].unlock()
	// 	this.done = true;//allow singleton instance to be overwritten
	// }

	// receiveTransferInfo(event, data){
	// 	console.log("Transfer", data);



	// }

	static updateFromState(transferState){
		console.log("TransferState: ", transferState)
		Transfer.transferStatusContainer = $("#TransferStatusContainer")

		


		Transfer.inProgress = transferState.inProgress;
		Transfer.readyToStart = transferState.readyToStart;
		if(Transfer.inProgress){
			tagConfigs.to.lock()
			tagConfigs.from.lock()
		}
		else{
			tagConfigs.to.unlock()
			tagConfigs.from.unlock()
		}


		if(transferState.inProgress){
			if(transferState.details.progress){

				let percentage = Math.floor( 100 * transferState.details.progress.index / transferState.details.progress.numTypes)

				Transfer.transferStatusContainer[0].innerHTML = `
					<div width:90%; margin:1em; display:flex; flex-direction:column; position:relative;">
					<div class="LoadingBarOuter"><div id="LoadingBarInner" class="LoadingBarInner" style="width"></div></div>

					<div class="ProgressContainer">
						<div class="Progress">
							<div>Step : ${transferState.details.step}</div>
							<div>Current Type : ${transferState.details.progress.type }</div>
							<div>Batch # : ${transferState.details.progress.batch}</div>
							<div>Batch Size : ${transferState.details.progress.batchSize}</div>

							<div>Progress : ${transferState.details.progress.index } / ${transferState.details.progress.numTypes }  (${percentage}%)</div>
						</div>
					</div>

					
					</div>
				`
				Transfer.loadingBarDiv = $("#LoadingBarInner")
				Transfer.loadingBarDiv.width(percentage + "%")
			}
			else{
				Transfer.transferStatusContainer[0].innerHTML = `
					<div width:90%; margin:1em; display:flex; flex-direction:column; position:relative;">
					
					<div class="LoadingBarOuter"></div>
					<div class="ProgressContainer">
						<div class="Progress">
							<div>Step : ${transferState.details.step || "..."}</div>
						</div>
					</div>
					</div>
				`

			}
			
		}
		else{

			Transfer.transferStatusContainer[0].innerHTML = `

				<div style="text-align:center; width:90%; margin:1em; position:relative;">

					${transferState.readyToStart?"Ready To Start":"Waiting on Credentials"}
				</div>
			`
		}
		



	}



	static requestTransfer(){
	
		if(Transfer.readyToStart){
			console.log("Sending start request to main")
			//a transfer is already ongoing
			ipcRenderer.send('requestTransfer',{})
		}
		
	}
	// static receiveTransferInformation(event, data){
	// 	if(Transfer.ist){
	// 		//forward to instance
	// 		Transfer.inst.receiveTransferInfo(event,data)
	// 	}

	// }

}

