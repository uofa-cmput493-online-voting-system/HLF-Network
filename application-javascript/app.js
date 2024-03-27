/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../test-application/javascript/AppUtil.js');

const channelName = 'transcationchannel';
const chaincodeName = 'transaction';
const voteChannelName = 'votechannel';
const voteChaincodeName = 'vote';


const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'javascriptAppUser';

function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}

// Import required modules
const express = require('express');

// Create an Express application
const app = express();
const port = 3000; // Port number to listen on
app.use(express.json()); // Middleware to parse JSON bodies


async function QueryTransactionByPoll(pollTableID) {
	const ccp = buildCCPOrg1();
	const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
	const wallet = await buildWallet(Wallets, walletPath);
	await enrollAdmin(caClient, wallet, mspOrg1);
	await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');
	const gateway = new Gateway();
	try {
		await gateway.connect(ccp, {
			wallet,
			identity: org1UserId,
			discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
		});

		const network = await gateway.getNetwork(channelName);
		const contract = network.getContract(chaincodeName);

		console.log('\n--> Evaluate Transaction: QueryTransactionByPoll, function returns an asset with a given assetID');
		let result = await contract.evaluateTransaction('QueryTransactionByPoll', pollTableID);
		return prettyJSONString(result.toString());

	} finally {
		// Disconnect from the gateway when the application is closing
		// This will close all connections to the network
		gateway.disconnect();
	}
}

async function CreateTransaction(assetID, transaction_type, poll_table_id, user_id, time_stamp) {
	const ccp = buildCCPOrg1();
	const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
	const wallet = await buildWallet(Wallets, walletPath);
	await enrollAdmin(caClient, wallet, mspOrg1);
	await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');
	const gateway = new Gateway();
	try {
		await gateway.connect(ccp, {
			wallet,
			identity: org1UserId,
			discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
		});

		const network = await gateway.getNetwork(channelName);
		const contract = network.getContract(chaincodeName);

		console.log('\n--> Submit Transaction: CreateTransaction, function returns an asset with a given assetID');
		await contract.submitTransaction('CreateTransaction', assetID, transaction_type, poll_table_id, user_id, time_stamp);
		console.log("result submitted ****");
		return "Transaction Created Successfully";

	} finally {
		// Disconnect from the gateway when the application is closing
		// This will close all connections to the network
		gateway.disconnect();
	}
}

async function CreateVote(id, poll_table_id, candidate_id, time_stamp) {
	const ccp = buildCCPOrg1();
	const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
	const wallet = await buildWallet(Wallets, walletPath);
	await enrollAdmin(caClient, wallet, mspOrg1);
	await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');
	const gateway = new Gateway();
	try {
		await gateway.connect(ccp, {
			wallet,
			identity: org1UserId,
			discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
		});

		const network = await gateway.getNetwork(voteChannelName);
		const contract = network.getContract(voteChaincodeName);

		console.log('\n--> Submit Vote: CreateVote, function returns an asset with a given assetID');
		await contract.submitTransaction('CreateVote', id, poll_table_id, candidate_id, time_stamp);
		console.log("result submitted ****");
		return "Vote Created Successfully";

	} finally {
		// Disconnect from the gateway when the application is closing
		// This will close all connections to the network
		gateway.disconnect();
	}
}

async function QueryVoteByPoll(pollTableID) {
	const ccp = buildCCPOrg1();
	const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
	const wallet = await buildWallet(Wallets, walletPath);
	await enrollAdmin(caClient, wallet, mspOrg1);
	await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');
	const gateway = new Gateway();
	try {
		await gateway.connect(ccp, {
			wallet,
			identity: org1UserId,
			discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
		});

		const network = await gateway.getNetwork(voteChannelName);
		const contract = network.getContract(voteChaincodeName);

		console.log('\n--> Evaluate Transaction: QueryVoteByPoll, function returns an vote with a given pollTableID');
		let result = await contract.evaluateTransaction('QueryVoteByPoll', pollTableID);
		return prettyJSONString(result.toString());

	} finally {
		// Disconnect from the gateway when the application is closing
		// This will close all connections to the network
		gateway.disconnect();
	}
}

// Define a route for GET requests to '/transactions'
app.get('/transactions', async (req, res) => {
	try {
		const pollID = req.query.pollID;
		let a = await QueryTransactionByPoll(pollID);

		// Extract data from the request and prepare the response
		const responseData = {
			message: `*** Result:${a}`,
			timestamp: new Date()
		};

		// Send the response
		res.json(responseData);
	} catch (error) {
		// Handle any errors that occur during the asynchronous operation
		console.error('An error occurred:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
});


app.post('/create-transaction', async (req, res) => {
	try {
		const requestData = req.body;

		console.log("Request Data", requestData);
		let a = await CreateTransaction(requestData.assetID, requestData.transaction_type, requestData.poll_table_id, requestData.user_id, requestData.time_stamp);

		// Extract data from the request and prepare the response
		const responseData = {
			message: `*** Result:${a}`,
			timestamp: new Date()
		};

		// Send the response
		res.json(responseData);
	} catch (error) {
		// Handle any errors that occur during the asynchronous operation
		console.error('An error occurred:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
});

// Define a route for GET requests to '/transactions'
app.get('/votes', async (req, res) => {
	try {
		const pollID = req.query.pollID;
		let a = await QueryVoteByPoll(pollID);

		// Extract data from the request and prepare the response
		const responseData = {
			message: `*** Result:${a}`,
			timestamp: new Date()
		};

		// Send the response
		res.json(responseData);
	} catch (error) {
		// Handle any errors that occur during the asynchronous operation
		console.error('An error occurred:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
});


app.post('/create-vote', async (req, res) => {
	try {
		const requestData = req.body;

		console.log("Request Data", requestData);
		let a = await CreateVote(requestData.id, requestData.poll_table_id, requestData.candidate_id, requestData.time_stamp);

		// Extract data from the request and prepare the response
		const responseData = {
			message: `*** Result:${a}`,
			timestamp: new Date()
		};

		// Send the response
		res.json(responseData);
	} catch (error) {
		// Handle any errors that occur during the asynchronous operation
		console.error('An error occurred:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
});

// Start the server and listen for incoming requests
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
