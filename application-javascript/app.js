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
const port = 3001; // Port number to listen on
app.use(express.json()); // Middleware to parse JSON bodies


async function GetPollTableHistory(pollTableID) {
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

		console.log('\n--> Evaluate Transaction: GetPollTableHistory, function returns an asset with a given assetID');
		let result = await contract.evaluateTransaction('GetPollTableHistory', pollTableID);
		return JSON.parse(result.toString());

	} finally {
		// Disconnect from the gateway when the application is closing
		// This will close all connections to the network
		gateway.disconnect();
	}
}

async function CreatePoll(poll_table_id, user_id, time_stamp) {
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

		console.log('\n--> Submit Transaction: CreatePoll, function returns an asset with a given assetID');
		await contract.submitTransaction('CreatePoll', poll_table_id, poll_table_id, user_id, time_stamp);
		console.log("result submitted ****");
		return "Transaction Created Successfully";

	} finally {
		// Disconnect from the gateway when the application is closing
		// This will close all connections to the network
		gateway.disconnect();
	}
}

async function AddVoteTransaction(pid, user_id) {
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

		console.log('\n--> Submit Transaction: AddVoteTransaction');
		await contract.submitTransaction('AddVoteTransaction', pid, user_id);
		console.log("result submitted ****");
		return "Transaction Created Successfully";

	} catch (error) {
		if (error.message.includes('already voted for poll')) {
			const error = new Error('You have already voted for this poll.');
			error.code = "ALREADY_VOTED";
			throw error;
		} else if (error.message.includes('end')) {
			const error = new Error('The poll has already ended.');
			error.code = "POLL_ENDED";
			throw error;
		}
	} finally {
		// Disconnect from the gateway when the application is closing
		// This will close all connections to the network
		gateway.disconnect();
	}
}

async function UpdatePoll(pid, newState) {
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

		console.log('\n--> Submit Transaction: UpdatePoll, function returns an asset with a given assetID');
		await contract.submitTransaction('UpdatePoll', pid, newState);
		console.log("result submitted ****");
		return "Transaction Created Successfully";

	} catch (error) {
		if (error.message.includes('is already in state')) {
			const error = new Error('The poll is already in the requested state.');
			error.code = "POLL_STATUS";
			throw error;
		}
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

		console.log('\n--> Submit Vote: CreateVote');
		await contract.submitTransaction('CreateVote', id, poll_table_id, candidate_id, time_stamp);
		console.log("result submitted ****");
		return "Vote Created Successfully";

	} finally {
		// Disconnect from the gateway when the application is closing
		// This will close all connections to the network
		gateway.disconnect();
	}
}

async function AddVote(pid) {
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

		console.log('\n--> Submit Vote: AddVote');
		await contract.submitTransaction('AddVote', pid);
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
		return JSON.parse(result.toString());

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
		let r = await GetPollTableHistory(pollID);

		// Extract data from the request and prepare the response
		// const responseData = {
		// 	message: `*** Result:${r}`,
		// 	timestamp: new Date()
		// };

		// Send the response
		res.json(r);
	} catch (error) {
		// Handle any errors that occur during the asynchronous operation
		console.error('An error occurred:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
});


app.post('/create-poll', async (req, res) => {
	try {
		const requestData = req.body;

		console.log("Request Data", requestData);
		let a = await CreatePoll(requestData.poll_table_id, requestData.user_id, requestData.time_stamp);

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

app.post('/add-transaction-vote', async (req, res) => {
	try {
		const requestData = req.body;

		console.log("Request Data", requestData);
		let result = await AddVoteTransaction(requestData.poll_table_id, requestData.user_id);

		// Extract data from the request and prepare the response
		const responseData = {
			message: `*** Result:${result}`,
			timestamp: new Date()
		};

		// Send the response
		res.json(responseData);
	} catch (error) {
		if (error.code === "ALREADY_VOTED") {
			res.status(409).json({ error: error.code });
		} else if (error.code === "POLL_ENDED") {
			res.status(410).json({ error: error.code });
		}
		else {
			// Handle any errors that occur during the asynchronous operation
			console.error('An error occurred:', error);
			res.status(500).json({ error: 'Internal Server Error' });
		}
	}
});

app.post('/update-poll', async (req, res) => {
	try {
		const requestData = req.body;

		console.log("Request Data", requestData);
		let result = await UpdatePoll(requestData.poll_table_id, requestData.newState);

		// Extract data from the request and prepare the response
		const responseData = {
			message: `*** Result:${result}`,
			timestamp: new Date()
		};
		// Send the response
		res.json(responseData);
	} catch (error) {
		if (error.code === "POLL_STATUS") {
			res.status(411).json({ error: error.code });
		} else {
			console.error('An error occurred:', error);
			res.status(500).json({ error: 'Internal Server Error' });
		}
	}
});

// Define a route for GET requests to '/transactions'
app.get('/votes', async (req, res) => {
	try {
		const pollID = req.query.pollID;
		let responseData = await QueryVoteByPoll(pollID);

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
		let r = await CreateVote(requestData.id, requestData.poll_table_id, requestData.candidate_id, requestData.time_stamp);

		// Extract data from the request and prepare the response
		const responseData = {
			message: `*** Result:${r}`,
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

app.post('/vote', async (req, res) => {
	try {
		const requestData = req.body;

		console.log("Request Data", requestData);
		let a = await AddVote(requestData.id);

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
