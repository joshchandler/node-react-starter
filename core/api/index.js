import express from 'express';
import _ from 'lodash';
// import users from './users';

import ConfigManager from '../config';

let config = ConfigManager.config;

function parseUrl(url) {
	var splitUrl = url.split('?'),
		endPoint = splitUrl[0].replace('/', ''),
		urlSplit = endPoint.split('.'),
		splitParams = splitUrl[1] === undefined ? undefined : splitUrl[1].split('&'),
		params = {};

	if (splitParams) {
		_.each(splitParams, (value) => {
			var separatedValue = value.split('=');
			params[separatedValue[0]] = separatedValue[1];
		});
	}

	return {
		api: urlSplit[0],
		method: urlSplit[1],
		params: params
	};
}

export default function api(appInstance) {
	let app = appInstance;
	let api = express();

	api.use((req, res) => {
		var parsed = parseUrl(req.url),
			apiEndpoint = require('./' + parsed.api),
			method = _.bindKey(apiEndpoint, parsed.method),
			options = {
				data: parsed.params,
				method: req.method,
				statusCode: req.statusCode,
			};

		method(options).then((result) => {
			res.send(result);
		});
	});

	app.use('/api', api);
}