![MedBloc](images/MedBloc.png)

_Blockchain for the New Zealand Healthcare System_
[![Build Status](https://travis-ci.com/j-x-huang/Medical-Blockchain.svg?token=YzVSmKzp9FBFfxnUC5cF&branch=master)](https://travis-ci.com/j-x-huang/Medical-Blockchain)


***
In this document we will detail how to setup MedBloc.
Further information on the repository structure and web apps can be found on our GitHub wiki.


## Setup Guide

### 1. Prerequisites

The following requirements must be met before installing the Hyperledger development tools:
* Operating Systems: Linux preferably Ubuntu 14.04 / 16.04 LTS (both 64-bit), or Mac OS 10.12 or higher
* Docker Engine: Version 17.03 or higher
* Docker-Compose: Version 1.8 or higher
* Node: 8.9 or higher (version 9 is not supported)
* npm: v5.x or higher
* git: 2.9.x or higher
* Python: 2.7.x
* VSCode (recommended but not required)

It is recommended that you use the macOS or Linux. If you use Window you will need to download the Linux subsystem and use the Linux bash terminal.

Now we must install the Composer CLI tools. In any directory run:

```sh
npm install -g composer-cli@2.0
npm install -g composer-rest-server@2.0
npm install -g generator-hyperledger-composer@2.0
npm install -g yo
```
  
In the composer-artifacts directory, use this command to download the Hyperledger Fabric tools:

```sh
mkdir fabric-dev-servers && cd fabric-dev-servers
 
curl -O https://raw.githubusercontent.com/hyperledger/composer-tools/master/packages/fabric-dev-servers/fabric-dev-servers.tar.gz
tar -xvf fabric-dev-servers.tar.gz
``` 
If you prefer to download a zip file, replace .tar.gz with .zip
 
After downloading the tools run these commands to download the Hyperledger Fabric runtime libraries:

```sh
cd fabric-dev-servers
export FABRIC_VERSION=hlfv12
./downloadFabric.sh
```

To start the network for the first time run these commands:
```sh
cd fabric-dev-servers
export FABRIC_VERSION=hlfv12
./startFabric.sh
./createPeerAdminCard.sh 
```
This will also create a business network card called PeerAdmin, which will be used to generate participant identities on the network.

To kill the network run 
```sh
docker kill $(docker ps -q)
docker rm $(docker ps -aq)
docker rmi $(docker images dev-* -q)
```

Further information regarding the installation Hyperledger Fabric and Composer can be found [here](https://hyperledger.github.io/composer/latest/installing/installing-index)

## 2. Setting up a single organization Fabric network

This section shows how MedBloc can be deployed on a single organization, single peer Fabric network. The single organization network should only be used for testing purposes. We assume the prerequisites have been completed. If the fabric-dev-server folder is not in the composer-artifacts directory, do so now.
 
First, navigate to the composer-artifacts directory and run `./QuickDeploy.sh` to deploy the network
  
This script will first remove any deployed Fabric containers running. It then starts a new Fabric network with 1 endorsing peer node, 1 certificate authority and 1 orderer node.
 
After that, it compiles the BND files in composer-artifact into a .bna file. The naming scheme is `medical-network@[verison].bna`. Then it will install the BNA file on the Fabric network. A network admin card is generated (admin@medical-network), via the PeerAdmin business card, and is added as a participant on the network.
 
The composer-cli tool will ping for the network admin on the network. A successful ping means that the network is running, and the admin identity has been correctly installed.

Do not worry if other errors are showing. As long as the ping is successful, it means that the network has been correctly deployed.

QuickUpgrade.sh, as the name implies, upgrades the current blockchain model. Before doing so, change the version number of the BND, by editing the 'version' attribute in the package.json file. Run `./QuickUpgrade.sh` to begin the process.

This script first compiles the BND files into a new .bna file. It then installs the BNA file on the network and redeploys the network. Afterwards, it will ping the network admin card again. A successful ping means that the network has been correctly upgraded.

Further information about deploying a single organization, single peer Fabric network can be found [here](https://hyperledger.github.io/composer/latest/tutorials/developer-tutorial)

## 3. Setting up a multi-organisation Fabric network

This section gives a summary of how MedBloc can be deployed on a two organization Fabric network. The network has 4 endorsing peer nodes belonging to two separate organisations along with 1 orderer node and 1 certificate authority. This network was the network we deployed for the exhibition. The process of setting the network up is a complicated process, so it is advised that you go through the details in the provided in the [link](https://hyperledger.github.io/composer/latest/tutorials/deploy-to-fabric-multi-org). Remember to replace all occurences of "trade-network" with "medical-network" as they use a different network model in their tutorial.

Before a multi-organisation Fabric network can be set up, if you have a previously installed Composer development environment, you will need to tear down the Hyperledger Fabric containers provided by the development environment. 

The first step is to download the multi-organisation sample from https://github.com/mahoney1/fabric-samples.git and then download the platform binaries into the sample folder.  You then need to switch to the multi-org branch and go into the first-network sample. Inside the first-network folder, you can start the network by using the commands:

```sh
./byfn.sh -m generate
./byfn.sh -m up -s couchdb -a
```

The first command should generate the Fabric network/security artifacts and the second command should start the network. If the network is successfully deployed, the terminal should show the message “All GOOD, BYFN execution completed”. 

The second step is to make a new temporary folder and create a Connection Profile for the CA and orderer node. The connection profile specifies the URL, port number and the identity (certificate) associated with the nodes.  A subfolder then needs to be created for each organisation.

The third and fourth step is to create a customised connection profile for each organisation then placing it inside the corresponding subfolder created earlier.

The fifth and sixth step is to locate the certificate and private key for the Hyperledger administrator for organisation 1 and 2 and place them inside the subfolder for organisation 1 and 2 respectively.

The seventh step is to create a business network card for the Hyperledger Fabric administrator for organisation 1 using the customised connection profile, certificate, and private key inside the corresponding subfolder. 

Step eight is the same as step seven, but only for Org2.

The ninth and tenth step is to import the business network cards for the Hyperledger Fabric administrator of organisation 1 and 2.

Step eleven and twelve is to install the business network onto the Hyperledger Fabric peer nodes for organisation 1 and 2. 

In step thirteen and fourteen, you need to create an endorsement policy file in the tmp folder and define the rules around which organizations must endorse transactions before they can be committed to the blockchain. 

In step fifteen and sixteen, the Hyperledger Fabric administrator certificates for organisation 1 and 2 need to be retrieved and used to create the business network administrators for organisation 1 and 2 respectively.  

In step seventeen, you need to start the network using the endorsement policy file and certificates of the business network administrator for each organisation.

The eighteenth and nineteenth step is to create and import the business network cards for the business network administrator of organisation 1 and 2. The business network cards of the business network administrators can then be used to create participants, assets, and transactions on the network.

## 4. Setting up the Composer Client Application (REST server)
After the network is running, we must create the client application. The client application will be hosted on a local REST server with exposed REST APIs.

Before we can begin please run the following command to install the composer REST server CLI tool if you haven’t done so.

```sh
npm install -g composer-rest-server@0.20
```

If you have a single node network deployed, run this command to generate the REST server for the admin.

```sh
composer-rest-server -c admin@medical-network -p 3000 -n never
```

Flags:
* -c: This is the name of the network card you wish to use. It does not have to be the admin. Network cards for any participant can be substituted for the admin card.
* -p: the port number to serve the REST API on.
* -n: whether the REST API should use namespaces (nz.ac.auckland) or not. For the web app to interact with the REST API, we must not use any namespaces.

Alternatively, you can just run “composer-rest-server,” and you will be presented with a step-by-step guide on installing the REST server.

Further detail on the composer-rest-server CLI can be found [here](https://hyperledger.github.io/composer/v0.19/integrating/getting-started-rest-api).

You can create separate REST servers for the Patient and Healthcare Provider by using these commands:

Patient:

`composer-rest-server -c [user]@medical-network -p 3002 -n never`

Healthcare Provider:

`composer-rest-server -c [user]@medical-network -p 3001 -n never`

For the web app to interact with the appropriate client apps, the port number for patients MUST be 3002, and the port number for healthcare providers MUST be 3001. Of course, you can instantiate more REST servers and use different port numbers, but extra steps will need to be taken if you wish to link the web app to the REST server. The identity (specified by -c) which the REST server is tied to must have already been imported on the network. See section 6 to learn how to issue identities.

If you go on http://localhost:3000/explorer/ (after installing the REST server), you will be presented with a GUI showing all the exposed REST APIs. The exposed API correspond to the transactions which can be invoked on the smart-contracts. You may call each API directly from the GUI. However, it is recommended you interact with the blockchain through the web applications.

## 5. Settings up the Web Applications
There are three types of web apps maintained: admin app (called web app in our repository), patient app and hp app. Setting up each web app is performed the same.

Before running the web apps, please install http-server using this command:
```sh
npm install -g http-server
```

You must also set-up one of the 3 REST servers specified in the previous section.

Now navigate to any web app directory (which you have set a corresponding REST server for). Use the following command to deploy the web app:

`http-server .`

After executing the command the terminal will show the web port it is deployed on. It is usually deployed on http:localhost:8080. However, if you have multiple web apps running it will go to port 8081, 8082 and so on. On a different terminal window, navigate to the other web app directories and use the same command to deploy the website.

You can access the web app by going on the link. Please refer to the wiki for the web app walkthrough guide.

### Multiples web apps and client apps
If you wish to deploy more than one of each type of app you must edit the code itself. First, duplicate the web app you wish to deploy by copying the folder and pasting it somewhere else. In the new web app folder, navigate to the angular-module.js file (within the js folder). At the very top of the file (line 1) add a variable called either ADMIN_ENDPOINT, HP_ENDPOINT, OR PATIENT_ENDPOINT. The variable name depends on the web-app you are deploying (i.e., if its an admin app, use ADMIN_ENDPOINT).

The variable must specify the URL of the REST server as a string. So if we deployed a new admin REST server on port 3005, the variable should look like this:

```
ADMIN_ENDPOINT = “http://localhost:3005/api/”
```

Remember to include the api tag and the backslash (“/”) at the end of the URL.
## 6. Generating network cards

A network card may be issued to a participant created on the blockchain. The network card will be used by the real-world participant to interact with the blockchain, via the client app. Identities must be issued by the network administrator. Before doing so, you must add the participant on the blockchain either through our admin web app or by calling the relevant REST API. After the participant is created, use this following command to issue them with an identity. In this scenario we present a patient participant named Joe Doe, who has the patient ID “P001”:

```sh
composer identity issue -c admin@medical-network -f joe.card -u jdoe -a "resource:nz.ac.auckland.Patient#P001"
```

Flags:
* -c: Name of the network card to use for issuing. Should be the network admin.
* -f: The card file name for the new identity. Can be any string.
* -u: The user ID for the new identity. Does not have to be related to the participant ID on the blockchain.
* -a: The participant, on the blockchain, to issue the new identity to.

More information on the flags can be found by typing `composer identity issue`.

The above command will generate a joe.card file. The identity must be imported into the network before it can be used. The command to do so is:

```sh
composer card import -f joe.card

composer network ping -c jdoe@medical-network
```

By pinging the card on the network, we can check if it has been successfully installed or not.

With this card installed you may now deploy a REST server which carries of the identity of the given card by following the process described in Section 4.

## 7. Test Guide
To run the unit tests open a new terminal and navigate to the ‘composer-artifacts’ directory, then run the command:

```sh
npm install
npm test
```

## 8. Issues
We have tested that our setup guide works correctly as of 12/8/18. However, Hyperledger regularly makes updates to Composer and Fabric, so by the time you deploy MedBloc, our setup guide may no longer be valid. We recommend you follow the official documentation (linked in this README) if you are unable to deploy MedBloc.

We have already experienced one issue related to Hyperledger's regular updates. Some time between our exhibition and the compendium due date, Hyperledger released a new update for Composer. This caused us to experience a bug where the Composer REST server would sometimes randomly shut down without any warning. If this happens to you, please start the REST server again and proceed as usual. 




