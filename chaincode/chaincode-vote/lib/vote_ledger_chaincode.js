'use strict';

const { Contract } = require('fabric-contract-api');

class Chaincode extends Contract {

	// create a new vote
	// id should be p<pid>c<cid>
	async CreateVote(ctx, id, poll_table_id, candidate_id, time_stamp) {
		const exists = await this.VoteExists(ctx, id);
		if (exists) {
			throw new Error(`The vote ${id} already exists`);
		}

		const vote = {
			id: id,
			pollTableID: poll_table_id,
			candidateID: candidate_id,
			timeStamp: time_stamp,
			voteCount: 0,
		};



		// === Save asset to state ===
		await ctx.stub.putState(id, Buffer.from(JSON.stringify(vote)));
		let indexName = 'poll~id';
		let pollIDIndexKey = await ctx.stub.createCompositeKey(indexName, [vote.pollTableID, vote.id]);

		//  Save index entry to state. Only the key name is needed, no need to store a duplicate copy of the marble.
		//  Note - passing a 'nil' value will effectively delete the key from state, therefore we pass null character as value
		await ctx.stub.putState(pollIDIndexKey, Buffer.from('\u0000'));
	}

	// ReadAsset returns the asset stored in the world state with given id.
	async ReadVote(ctx, id) {
		const voteJSON = await ctx.stub.getState(id); // get the asset from chaincode state
		if (!voteJSON || voteJSON.length === 0) {
			throw new Error(`Asset ${id} does not exist`);
		}

		return voteJSON.toString();
	}

	// delete - remove a asset key/value pair from state
	// async DeleteTransaction(ctx, id) {
	// 	if (!id) {
	// 		throw new Error('Transaction name must not be empty');
	// 	}

	// 	let exists = await this.AssetExists(ctx, id);
	// 	if (!exists) {
	// 		throw new Error(`Asset ${id} does not exist`);
	// 	}

	// 	// to maintain the poll~id index, we need to read the asset first and get its poll id
	// 	let valAsbytes = await ctx.stub.getState(id); // get the asset from chaincode state
	// 	let jsonResp = {};
	// 	if (!valAsbytes) {
	// 		jsonResp.error = `Transaction does not exist: ${id}`;
	// 		throw new Error(jsonResp);
	// 	}
	// 	let assetJSON;
	// 	try {
	// 		assetJSON = JSON.parse(valAsbytes.toString());
	// 	} catch (err) {
	// 		jsonResp = {};
	// 		jsonResp.error = `Failed to decode JSON of: ${id}`;
	// 		throw new Error(jsonResp);
	// 	}
	// 	await ctx.stub.deleteState(id); //remove the asset from chaincode state

	// 	// delete the index
	// 	let indexName = 'poll~id';
	// 	let pollIDIndexKey = ctx.stub.createCompositeKey(indexName, [assetJSON.pollTableID, assetJSON.assetID]);
	// 	if (!pollIDIndexKey) {
	// 		throw new Error(' Failed to create the createCompositeKey');
	// 	}
	// 	//  Delete index entry to state.
	// 	await ctx.stub.deleteState(pollIDIndexKey);
	// }

	// TransferAsset transfers a asset by setting a new owner name on the asset
	// this was transferset(ctx, assetName, newOwner)
	async AddVote(ctx, assetName) {

		let transactionAsBytes = await ctx.stub.getState(assetName);
		if (!transactionAsBytes || !transactionAsBytes.toString()) {
			throw new Error(`Asset ${assetName} does not exist`);
		}
		let t_to_update = {};
		try {
			t_to_update = JSON.parse(transactionAsBytes.toString()); //unmarshal
		} catch (err) {
			let jsonResp = {};
			jsonResp.error = 'Failed to decode JSON of: ' + assetName;
			throw new Error(jsonResp);
		}
		t_to_update.voteCount = t_to_update.voteCount + 1; //change 

		let transactionJSONasBytes = Buffer.from(JSON.stringify(t_to_update));
		await ctx.stub.putState(assetName, transactionJSONasBytes); //rewrite the asset
	}


	async QueryVoteByPoll(ctx, pollTableID) {
		let queryString = {};
		queryString.selector = {};
		queryString.selector.pollTableID = pollTableID;
		return await this.GetQueryResultForQueryString(ctx, JSON.stringify(queryString)); //shim.success(queryResults);
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

	// GetQueryResultForQueryString executes the passed in query string.
	// Result set is built and returned as a byte array containing the JSON results.
	async GetQueryResultForQueryString(ctx, queryString) {

		let resultsIterator = await ctx.stub.getQueryResult(queryString);
		let results = await this._GetAllResults(resultsIterator, false);

		return JSON.stringify(results);
	}



	// GetAssetHistory returns the chain of custody for an asset since issuance.
	async GetVoteHistory(ctx, assetName) {

		let resultsIterator = await ctx.stub.getHistoryForKey(assetName);
		let results = await this._GetAllResults(resultsIterator, true);

		return JSON.stringify(results);
	}

	// AssetExists returns true when asset with given ID exists in world state
	async VoteExists(ctx, assetName) {
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
		const votes = [
			{
				id: '1',
				pollTableID: 5,
				candidateID: 5,
				timeStamp: Date.now(),
			},
		];

		for (const vote of votes) {
			await this.CreateVote(
				ctx,
				vote.id,
				vote.pollTableID,
				vote.candidateID,
				vote.timeStamp
			);
		}
	}
}

module.exports = Chaincode;
