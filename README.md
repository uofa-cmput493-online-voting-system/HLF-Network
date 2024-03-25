### Getting Started

## prerequisite:
install docker:https://docs.docker.com/engine/install/ubuntu/

install jq:​​ sudo apt-get install jq

## set up network
cd network/

# first, bring down the network
./network.sh down

# bring up the network and create the channel for transactions
./network.sh up createChannel -c transcationchannel -s couchdb -ca

# deploy smart contract 
./network.sh deployCC -ccn ledger -c transcationchannel -ccp ../chaincode/chaincode-transaction/ -ccl javascript -ccep "OR('Org1MSP.peer','Org2MSP.peer')"

# Set CLI and config paths
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/

# Environment variables for Org1
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051