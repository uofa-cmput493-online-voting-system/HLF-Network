// FR24 - Chaincode: Chaincode (smart contracts) shall be deployed to validate transaction and store voter choices against predefined rules before they are added to the blockchain
// FR26 - Block.Structure: Transaction on the blockchain shall be structured to include the following data: transaction ID, timestamp, transaction type (e.g. vote choice, poll table transaction log, poll ended), foreign key to the poll table, and encrypted payload. A hash of the preceding block shall also be included in the new block to ensure chain integrity.

'use strict';

const { Contract } = require('fabric-contract-api');

class Chaincode extends Contract {

	// CreateAsset - create a new asset, store into chaincode state
	async CreatePoll(ctx, assetID, poll_table_id, user_id, time_stamp) {
		const exists = await this.TransactionExists(ctx, assetID);
		if (exists) {
			throw new Error(`The asset ${assetID} already exists`);
		}

		// ==== Create asset object and marshal to JSON ====
		let asset = {
			docType: 'asset',
			assetID: assetID,
			transcationType: 'create',
			pollTableID: poll_table_id,
			userID: user_id,
			timeStamp: time_stamp,
		};



		// === Save asset to state ===
		await ctx.stub.putState(assetID, Buffer.from(JSON.stringify(asset)));
		let indexName = 'poll~id';
		let pollIDIndexKey = await ctx.stub.createCompositeKey(indexName, [asset.pollTableID, asset.assetID]);

		//  Save index entry to state. Only the key name is needed, no need to store a duplicate copy of the marble.
		//  Note - passing a 'nil' value will effectively delete the key from state, therefore we pass null character as value
		await ctx.stub.putState(pollIDIndexKey, Buffer.from('\u0000'));
	}

	// ReadAsset returns the asset stored in the world state with given id.
	async ReadTransaction(ctx, id) {
		const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
		if (!assetJSON || assetJSON.length === 0) {
			throw new Error(`Asset ${id} does not exist`);
		}

		return assetJSON.toString();
	}

	// delete - remove a asset key/value pair from state
	async DeleteTransaction(ctx, id) {
		if (!id) {
			throw new Error('Transaction name must not be empty');
		}

		let exists = await this.TransactionExists(ctx, id);
		if (!exists) {
			throw new Error(`Asset ${id} does not exist`);
		}

		// to maintain the poll~id index, we need to read the asset first and get its poll id
		let valAsbytes = await ctx.stub.getState(id); // get the asset from chaincode state
		let jsonResp = {};
		if (!valAsbytes) {
			jsonResp.error = `Transaction does not exist: ${id}`;
			throw new Error(jsonResp);
		}
		let assetJSON;
		try {
			assetJSON = JSON.parse(valAsbytes.toString());
		} catch (err) {
			jsonResp = {};
			jsonResp.error = `Failed to decode JSON of: ${id}`;
			throw new Error(jsonResp);
		}
		await ctx.stub.deleteState(id); //remove the asset from chaincode state

		// delete the index
		let indexName = 'poll~id';
		let pollIDIndexKey = ctx.stub.createCompositeKey(indexName, [assetJSON.pollTableID, assetJSON.assetID]);
		if (!pollIDIndexKey) {
			throw new Error(' Failed to create the createCompositeKey');
		}
		//  Delete index entry to state.
		await ctx.stub.deleteState(pollIDIndexKey);
	}

	async UpdatePoll(ctx, pid, newState) {

		let transactionAsBytes = await ctx.stub.getState(pid);
		if (!transactionAsBytes || !transactionAsBytes.toString()) {
			throw new Error(`Asset ${pid} does not exist`);
		}
		let t_to_update = {};
		try {
			t_to_update = JSON.parse(transactionAsBytes.toString()); //unmarshal
		} catch (err) {
			let jsonResp = {};
			jsonResp.error = 'Failed to decode JSON of: ' + pid;
			throw new Error(jsonResp);
		}
		if (t_to_update.transcationType === 'end') {
			throw new Error(`Poll table ${pid} is already in state ${newState}, update is not allowed`);
		}
		if (t_to_update.transcationType === newState) {
			throw new Error(`Poll table ${pid} is already in state ${newState}`);
		}
		if (newState === 'vote') {
			throw new Error(`Should AddVoteTransaction instead of UpdatePoll for poll ${pid}`);
		}
		t_to_update.transcationType = newState; //change 

		let transactionJSONasBytes = Buffer.from(JSON.stringify(t_to_update));
		await ctx.stub.putState(pid, transactionJSONasBytes); //rewrite the asset
	}

	async AddVoteTransaction(ctx, pid, user_id) {
		let exist = await this.TransactionForUserOnPollExist(ctx, pid, user_id);
		if (exist) {
			throw new Error(`User ${user_id} already voted for poll ${pid}`);
		}
		let transactionAsBytes = await ctx.stub.getState(pid);
		if (!transactionAsBytes || !transactionAsBytes.toString()) {
			throw new Error(`Poll Table ${pid} does not exist`);
		}
		let t_to_update = {};
		try {
			t_to_update = JSON.parse(transactionAsBytes.toString()); //unmarshal
		} catch (err) {
			let jsonResp = {};
			jsonResp.error = 'Failed to decode JSON of: ' + pid;
			throw new Error(jsonResp);
		}
		if (t_to_update.transcationType === 'end') {
			throw new Error(`Poll table ${pid} is already in end state, cannot add more transactions`);
		}
		t_to_update.transcationType = 'vote'; //change 
		t_to_update.user_id = user_id;

		let transactionJSONasBytes = Buffer.from(JSON.stringify(t_to_update));
		await ctx.stub.putState(pid, transactionJSONasBytes); //rewrite the asset
	}


	async UpdateTransactionByPoll(ctx, pollTableID, newState) {
		// Query the color~name index by color
		// This will execute a key range query on all keys starting with 'color'
		let pollResultsIterator = await ctx.stub.getStateByPartialCompositeKey('poll~id', [pollTableID]);

		// Iterate through result set and for each asset found, transfer to newOwner
		let responseRange = await pollResultsIterator.next();
		while (!responseRange.done) {
			if (!responseRange || !responseRange.value || !responseRange.value.key) {
				return;
			}

			let objectType;
			let attributes;
			(
				{ objectType, attributes } = await ctx.stub.splitCompositeKey(responseRange.value.key)
			);

			console.log(objectType);
			let returnedAssetName = attributes[1];

			// Now call the transfer function for the found asset.
			// Re-use the same function that is used to transfer individual assets
			await this.UpdatePoll(ctx, returnedAssetName, newState);
			responseRange = await pollResultsIterator.next();
		}
	}

	// QueryAssetsByOwner queries for assets based on a passed in owner.
	// This is an example of a parameterized query where the query logic is baked into the chaincode,
	// and accepting a single query parameter (owner).
	// Only available on state databases that support rich query (e.g. CouchDB)
	// Example: Parameterized rich query
	async QueryTransactionByPoll(ctx, pollTableID) {
		let queryString = {};
		queryString.selector = {};
		queryString.selector.docType = 'asset';
		queryString.selector.pollTableID = pollTableID;
		return await this.GetQueryResultForQueryString(ctx, JSON.stringify(queryString)); //shim.success(queryResults);
	}

	async QueryVoteTransactionByPollAndUser(ctx, pollTableID, uid) {
		let queryString = {};
		queryString.selector = {};
		queryString.selector.transcationType = 'vote';
		queryString.selector.pollTableID = pollTableID;
		queryString.selector.userID = uid;
		return await this.GetQueryResultForQueryString(ctx, JSON.stringify(queryString)); //shim.success(queryResults);
	}


	async TransactionForUserOnPollExist(ctx, pollTableID, uid) {
		let result = await this.QueryVoteTransactionByPollAndUser(ctx, pollTableID, uid);
		return result && result.length > 2;
	}

	// Example: Ad hoc rich query
	// QueryAssets uses a query string to perform a query for assets.
	// Query string matching state database syntax is passed in and executed as is.
	// Supports ad hoc queries that can be defined at runtime by the client.
	// If this is not desired, follow the QueryAssetsForOwner example for parameterized queries.
	// Only available on state databases that support rich query (e.g. CouchDB)
	async QueryAssets(ctx, queryString) {
		return await this.GetQueryResultForQueryString(ctx, queryString);
	}

	async GetQueryResultForQueryString(ctx, queryString) {

		let resultsIterator = await ctx.stub.getQueryResult(queryString);
		let results = await this._GetAllResults(resultsIterator, false);

		return JSON.stringify(results);
	}
	async GetPollTableHistory(ctx, assetName) {

		let resultsIterator = await ctx.stub.getHistoryForKey(assetName);
		let results = await this._GetAllResults(resultsIterator, true);

		return JSON.stringify(results);
	}

	// TransactionExists returns true when asset with given ID exists in world state
	async TransactionExists(ctx, assetName) {
		// ==== Check if asset already exists ====
		let assetState = await ctx.stub.getState(assetName);
		return assetState && assetState.length > 0;
	}

	// This is JavaScript so without Funcation Decorators, all functions are assumed
	// to be transaction functions
	//
	// For internal functions... prefix them with _
	async _GetAllResults(iterator, isHistory) {
		let allResults = [];
		let res = await iterator.next();
		while (!res.done) {
			if (res.value && res.value.value.toString()) {
				let jsonRes = {};
				console.log(res.value.value.toString('utf8'));
				if (isHistory && isHistory === true) {
					jsonRes.TxId = res.value.txId;
					jsonRes.Timestamp = res.value.timestamp;
					try {
						jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
					} catch (err) {
						console.log(err);
						jsonRes.Value = res.value.value.toString('utf8');
					}
				} else {
					jsonRes.Key = res.value.key;
					try {
						jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
					} catch (err) {
						console.log(err);
						jsonRes.Record = res.value.value.toString('utf8');
					}
				}
				allResults.push(jsonRes);
			}
			res = await iterator.next();
		}
		iterator.close();
		return allResults;
	}


	// InitLedger creates sample assets in the ledger
	async InitLedger(ctx) {
		const assets = [
			{
				assetID: '1',
				transcationType: 'create',
				pollTableID: '2',
				userID: '3',
				timeStamp: Date.now(),
			},
		];

		for (const asset of assets) {
			await this.CreatePoll(
				ctx,
				asset.assetID,
				asset.transcationType,
				asset.pollTableID,
				asset.userID,
				asset.timeStamp
			);
		}
	}
}

module.exports = Chaincode;
