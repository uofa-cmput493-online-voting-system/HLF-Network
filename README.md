# HLF-Network
### Getting Started

## prerequisite:
 - docker:
  install docker:https://docs.docker.com/engine/install/ubuntu/
- jp:
  install jq:​​ sudo apt-get install jq
- npm:
  https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
## set up network

```
  cd HLF-Network/network/
```

first, bring down the network if it was up
```
  ./network.sh down
```
then bring up the network
```
  ./network.sh up -ca -s couchdb 
```
now, you have bring up the network with two organizations, each with two peer nodes, and an order organization with one order nodes!
this network uses couchdb as the world state database, and it uses fabric CA to issue enrollment certificates and TLS .
create the channel for transaction
```
  ./network.sh createChannel -c transcationchannel
```
create the channel for vote
```
  ./network.sh createChannel -c votechannel
```
now you have created two channels, and all the organzations within the network has joined in both channels.
create the smart contract for transactions, this smart contract is named 'transaction'
```
  ./network.sh deployCC -ccn transaction -c transcationchannel -ccp ../chaincode/chaincode-transaction/ -ccl javascript -ccep "OR('Org1MSP.peer','Org2MSP.peer')"

```
create the smart contract for vote, this smart contract is named 'vote'
```
  ./network.sh deployCC -ccn vote -c votechannel -ccp ../chaincode/chaincode-vote/ -ccl javascript -ccep "OR('Org1MSP.peer','Org2MSP.peer')"

```
now, we have deployed the smart contracts to the channels and the peer nodes.

we are done setting up the network!

## set the gateway service server
```
  cd ../application-javascript/
```
```
  npm install
```
```
  node app.js
```
now the server is runnig on localhost:3000

# author:
Qi Zoey Zhou
