const { ipcMain } = require("electron");
const axios = require('axios');

function fixHost(raw) {
	if (raw.lastIndexOf('/') == raw.length - 1) {
		raw = raw.substring(0, raw.length - 1);//strip the /
	}

	if (raw.indexOf('http') != 0) {
		raw = 'http://' + raw;//default to http instead of https due to proabable usage of localhost
	}
	return raw;
}

/*
Correct
[ 'status', 'statusText', 'headers', 'config', 'request', 'data' ]

Invalid Host
[
	'errno',
	'code',
	'syscall',
	'hostname',
	'config',
	'request',
	'response',
	'isAxiosError',
	'toJSON'
]
 errno: -3008,
	code: 'ENOTFOUND'

Connection refused
[
	'errno',        'code',
	'syscall',      'address',
	'port',         'config',
	'request',      'response',
	'isAxiosError', 'toJSON'
]
errno: -61,
code: 'ECONNREFUSED',


401
response.status = 401
response.statusText= "Unauthorized"
[ 'config', 'request', 'response', 'isAxiosError', 'toJSON' ]


*/

class TagValidator {
	constructor(data) {
		console.log("Validating Tag: ", data);

		if (!data.host) {
			console.log("Bad host")
			return;
		}
		else {
			TagValidator.instances.push(this);

			TagValidator.validate(data).then((result) => {
				event.reply(data.respondTo, result)

				for (let i = 0; i < TagValidator.instances.length; i++) {
					if (TagValidator.instances[i] == this) {
						TagValidator.instances.splice(i, 1);
					}
				}
			});
		}


	}
	// Magic http response validation based on presense of certain fields in the response (Sorry)
	static parseValidationResponse(res, resolve, requestUrl) {

		console.log(Object.keys(res))
		if (res.errno) {
			//Failure connecting
			resolve({ status: "bad", code: res.code })

		}
		else if (res.response) {
		
			resolve({ status: "bad", code: res.response.status + " " + res.response.statusText })
		}
		else if (res.status) {
			if (res.status == 200) {
				if(res.request && res.request.res && res.request.res.responseUrl){

					if(res.request.res.responseUrl != requestUrl){
						// Okta redirect (or other redirect)
						resolve({ status: "bad", code: "Expired or incorrect AuthToken" })
						return;
					}
				}
				resolve({ status: "good", code: res.status })
			}
			else {
				resolve({ status: "bad", code: res.status + " " + res.statusText })
			}
		}
		else {
			console.log("Unknown connection err", res)
			resolve({ status: "bad", code: "Unknown" })
		}


	}
	static validate(data) {
		return new Promise((resolve) => {
			let host = fixHost(data.host);

			let url = `${host}/api/1/${data.tenant}/${data.tag}/Console?action=init`
			let headers = {
				Cookie: `c3tenant=${data.tenant}; c3tag=${data.tag}`
			}
			if (data.token || data.token == "" || data.token == "<c3Auth Token>"){
				const token = Buffer.from(`${data.username}:${data.password}`, 'UTF-8').toString('base64');
				headers.Authorization = `Basic ${token}`;
				// headers.auth = {
				// 	username: data.username,
				// 	password: data.password
				// }
			} else {
				headers.Cookie += `; c3auth=${data.token}`
			}

			console.log("Sending request to - ", url)

			axios.post(url, {}, { headers })
				.catch((err) => {
					TagValidator.parseValidationResponse(err, resolve, url)
				})
				.then(response => {
					TagValidator.parseValidationResponse(response, resolve, url)

				}).catch((err) => {
					// TagValidator.parseValidationResponse(err, resolve)
					console.log(err)
					// resolve({status:"bad3"})
				});

		})

	}


	static validateTag(event, data) {
		new TagValidator(event, data)
	}

}

TagValidator.instances = []

module.exports = {
	TagValidator,
	fixHost
}