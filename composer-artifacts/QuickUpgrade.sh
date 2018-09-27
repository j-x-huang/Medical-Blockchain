#!/bin/bash

echo "Creating Archive"
composer archive create -t dir -n .

name=`cat package.json | jq -r '.name'`
version=`cat package.json | jq -r '.version'`

archiveName=$name@$version.bna

echo "Installing archive file"
composer network install --card PeerAdmin@hlfv1 --archiveFile $archiveName

echo "Upgrading network"
composer network upgrade -c PeerAdmin@hlfv1 -n $name -V $version

echo "Ping network"
composer network ping -c admin@$name
