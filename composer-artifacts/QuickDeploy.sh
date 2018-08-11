#!/bin/bash

echo "Tidying up old artifacts"
./fabric-tools/stopFabric.sh
./fabric-tools/tearDownFabric.sh

./fabric-tools/startFabric.sh
./fabric-tools/createPeerAdminCard.sh

echo "Creating Archive"
composer archive create -t dir -n .
name=`cat package.json | jq -r '.name'`
version=`cat package.json | jq -r '.version'`

archiveName=$name@$version.bna

echo "Installing archive file"
composer network install --card PeerAdmin@hlfv1 --archiveFile $archiveName

echo "Starting network"
composer network start --networkName $name --networkVersion $version --networkAdmin admin --networkAdminEnrollSecret adminpw --card PeerAdmin@hlfv1 --file networkadmin.card

echo "Importing admin card"
composer card import --file networkadmin.card

echo "Ping network"
composer network ping --card admin@$name