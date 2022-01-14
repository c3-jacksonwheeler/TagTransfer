class Transfer {
	constructor() {
	}
	
	static updateFromState(transferState) {
		// Server has given us an update on the Transfer Status
		console.log("TransferState: ", transferState)
		Transfer.transferStatusContainer = $("#TransferStatusContainer")

		Transfer.inProgress = transferState.inProgress;
		Transfer.readyToStart = transferState.readyToStart;
		if (Transfer.inProgress) {
			tagConfigs.to.lock()
			tagConfigs.from.lock()
		}
		else {
			tagConfigs.to.unlock()
			tagConfigs.from.unlock()
		}


		if (transferState.inProgress) {
			if (transferState.details.progress) {

				let percentage = Math.floor(100 * transferState.details.progress.index / transferState.details.progress.numTypes)

				Transfer.transferStatusContainer[0].innerHTML = `
					<div width:90%; margin:1em; display:flex; flex-direction:column; position:relative;">
					<div class="LoadingBarOuter"><div id="LoadingBarInner" class="LoadingBarInner" style="width"></div></div>

					<div class="ProgressContainer">
						<div class="Progress">
							<div>Step : ${transferState.details.step}</div>
							<div>Current Type : ${transferState.details.progress.type}</div>
							<div>Batch # : ${transferState.details.progress.batch}</div>
							<div>Batch Size : ${transferState.details.progress.batchSize}</div>

							<div>Progress : ${transferState.details.progress.index} / ${transferState.details.progress.numTypes}  (${percentage}%)</div>
						</div>
					</div>

					
					</div>
				`
				Transfer.loadingBarDiv = $("#LoadingBarInner")
				Transfer.loadingBarDiv.width(percentage + "%")
			}
			else {
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
		else {

			if (transferState.readyToStart) {
				Transfer.transferStatusContainer[0].innerHTML = `

				<div style="text-align:center; width:90%; margin:1em; position:relative;">

					<div><u>Ready To Start</u></div>
			
					<div><h3> Options </h3></div>
					
					<div class="TransferOptionsContainer">
						<div class="TransferOptions">

							&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Start Index:
							<input type="text" placeholder="Start from index" id="Transfer_startFromIndex" value=0>
							</br>

							Blacklist (csv):
							<input type="text" placeholder="Example,Example2" id="Transfer_blacklist">
							</br></br>

							Use Whitelist: <input type="checkbox" id="Transfer_useWhitelist">
							</br>
							
							Whitelist (csv):
							<input type="text" placeholder="Example,Example2" id="Transfer_whitelist" >
							</br></br>
							Dry Run(no merge): <input type="checkbox" id="Transfer_useDryRun">
							</br>
							
						</div>
					</div>
					<button id="transferStart" onclick="Transfer.requestTransfer()">Begin Transfer!</button>
					

				</div>
			`
			}
			else {

				Transfer.transferStatusContainer[0].innerHTML = `
				<div style="text-align:center; width:90%; margin:1em; position:relative;">

				Waiting for Credentials
				</div>
			`

			}
		}
	}

	static requestTransfer() {

		if (Transfer.readyToStart) {
			console.log("Sending start request to main")
		

			//get options from UI
			let startFrom = Number($("#Transfer_startFromIndex").val())
			let blacklistRaw = $("#Transfer_blacklist").val()
			let blacklist = blacklistRaw.split(",").map(v => v.trim()).filter((v) => { if (v.length) { return v } })

			let useWhitelist = $("#Transfer_useWhitelist").is(":checked");

			let whitelist = undefined;
			if (useWhitelist) {
				let whitelistRaw = $("#Transfer_whitelist").val()
				whitelist = whitelistRaw.split(",").map(v => v.trim()).filter((v) => { if (v.length) { return v } })
			}

			let useDryRun = $("#Transfer_useDryRun").is(":checked");

			console.log({ startFrom, blacklist, useWhitelist, whitelist, useDryRun })


			// Kick off the transfer request, but Server has the ability to ignore if it wants, check out src/TransferState.js
			ipcRenderer.send('requestTransfer', { startFrom, blacklist, useWhitelist, whitelist, useDryRun })
		}

	}
	

}

