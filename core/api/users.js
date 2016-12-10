import _ from 'lodash';
import pipeline from '../utils/pipeline';
import Promise from 'bluebird';
import errors from '../errors';
// import i18n from 'i18n';
import dataProvider from '../models';

export default {
	browse(options) {
		var tasks;
		if (options.method !== 'GET') return;

		/**
		 * ### Model Query
		 * Make the call to the Model layer
		 * @param {Object} options
		 * @returns {Object} options
		 */
		function doQuery(options) {
			return dataProvider.User.findAll(options);
		}

		// Push all of our tasks into a `tasks` array in the correct order
		tasks = [
			doQuery
		];

		// Pipeline calls each task passing the result of one to be the arguments for the next
		return pipeline(tasks, options);
	},
	read(options) {
		var tasks;
		if (options.method !== 'GET') return;

		function doQuery(options) {
			return dataProvider.User.findOne(options.data, _.omit(options, ['data']));
		}

		tasks = [
			doQuery
		];

		return pipeline(tasks, options);
	},
	create(options) {
		var tasks;
		if (options.method !== 'POST') return;

		function doQuery(options) {
			return dataProvider.User.create(options.data, _.omit(options, ['data']));
		}

		tasks = [
			doQuery
		];

		return pipeline(tasks, options).then(function formatResponse(result) {
			if (result) {
				return {users: [result.toJSON(options)]};
			}

			return Promise.reject({message: 'errors.api.users.userNotFound'});

		});
	},
	edit(options) {

	},
	changePassword(options) {

	},
};