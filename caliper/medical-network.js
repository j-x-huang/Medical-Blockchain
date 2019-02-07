'use strict';

module.exports.info = 'Medical Network Performance Test';

const composerUtils = require('../../../src/composer/composer_utils');
const removeExisting = require('../composer-test-utils').clearAll;
const logger = require('../../../src/comm/util').getLogger('medical-network.js');
const os = require('os');

const namespace = 'nz.ac.auckland';
const busNetName = 'medical-network';
const uuid = os.hostname() + process.pid; // UUID for client within test

let bc;                 // The blockchain main (Composer)
let busNetConnections;  // Global map of all business network connections to be used
let testAssetNum;       // Number of test assets to create
let factory;            // Global Factory
let fourKB = "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. Nam quam nunc, blandit vel, luctus pulvinar, hendrerit id, lorem. Maecenas nec odio et ante tincidunt tempus. Donec vitae sapien ut libero venenatis faucibus. Nullam quis ante. Etiam sit amet orci eget eros faucibus tincidunt. Duis leo. Sed fringilla mauris sit amet nibh. Donec sodales sagittis magna. Sed consequat, leo eget bibendum sodales, augue velit cursus nunc, quis gravida magna mi a libero. Fusce vulputate eleifend sapien. Vestibulum purus quam, scelerisque ut, mollis sed, nonummy id, metus. Nullam accumsan lorem in dui. Cras ultricies mi eu turpis hendrerit fringilla. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; In ac dui quis mi consectetuer lacinia. Nam pretium turpis et arcu. Duis arcu tortor, suscipit eget, imperdiet nec, imperdiet iaculis, ipsum. Sed aliquam ultrices mauris. Integer ante arcu, accumsan a, consectetuer eget, posuere ut, mauris. Praesent adipiscing. Phasellus ullamcorper ipsum rutrum nunc. Nunc nonummy metus. Vestibulum volutpat pretium libero. Cras id dui. Aenean ut eros et nisl sagittis vestibulum. Nullam nulla eros, ultricies sit amet, nonummy id, imperdiet feugiat, pede. Sed lectus. Donec mollis hendrerit risus. Phasellus nec sem in justo pellentesque facilisis. Etiam imperdiet imperdiet orci. Nunc nec neque. Phasellus leo dolor, tempus non, auctor et, hendrerit quis, nisi. Curabitur ligula sapien, tincidunt non, euismod vitae, posuere imperdiet, leo. Maecenas malesuada. Praesent congue erat at massa. Sed cursus turpis vitae tortor. Donec posuere vulputate arcu. Phasellus accumsan cursus velit. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Sed aliquam, nisi quis porttitor congue, elit erat euismod orci, ac placerat dolor lectus quis orci. Phasellus consectetuer vestibulum elit. Aenean tellus metus, bibendum sed, posuere ac, mattis non, nunc. Vestibulum fringilla pede sit amet augue. In turpis. Pellentesque posuere. Praesent turpis. Aenean posuere, tortor sed cursus feugiat, nunc augue blandit nunc, eu sollicitudin urna dolor sagittis lacus. Donec elit libero, sodales nec, volutpat a, suscipit non, turpis. Nullam sagittis. Suspendisse pulvinar, augue ac venenatis condimentum, sem libero volutpat nibh, nec pellentesque velit pede quis nunc. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Fusce id purus. Ut varius tincidunt libero. Phasellus dolor. Maecenas vestibulum mollis diam. Pellentesque ut neque. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. In dui magna, posuere eget, vestibulum et, tempor auctor, justo. In ac felis quis tortor malesuada pretium. Pellentesque auctor neque nec urna. Proin sapien ipsum, porta a, auctor quis, euismod ut, mi. Aenean viverra rhoncus pede. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Ut non enim eleifend felis pretium feugiat. Vivamus quis mi. Phasellus a est. Phasellus magna. In hac habitasse platea dictumst. Curabitur at lacus ac velit ornare lobortis. Cura"
let userName;

module.exports.init = async function (blockchain, context, args) {
    bc = blockchain;
    busNetConnections = new Map();
    busNetConnections.set('admin', context);
    testAssetNum = args.testAssets;
    factory = busNetConnections.get('admin').getBusinessNetwork().getFactory();

    let patientRegistry = await busNetConnections.get('admin').getParticipantRegistry(namespace + '.Patient');
    let hpRegistry = await busNetConnections.get('admin').getParticipantRegistry(namespace + '.HealthProvider');
    let assetRegistry = await busNetConnections.get('admin').getAssetRegistry(namespace + '.PatientKey');

    const NO_OF_ASSETS = 300;
    try {

        let patient1 = factory.newResource(namespace, 'Patient', 'P' + uuid);
        patient1.birthDate = "19/4/1994";
        patient1.prefix = "Mr.";
        patient1.first = "Emmanuel";
        patient1.last = "Adams";
        patient1.ethinicity = "irish";
        patient1.gender = "Male";
        patient1.address = "53 Kristopher Springs Suite 264 Whitman MA 02382 US";
        patient1.publicKey = "";
        patient1.consentedHPs = [];
        
        let populated1 = await patientRegistry.exists(patient1.getIdentifier());
        if (!populated1) {
            await patientRegistry.add(patient1);
        }

        let hps = Array();
        for (var i = 0; i < NO_OF_ASSETS; i++) {
            let hp = factory.newResource(namespace, 'HealthProvider', 'HP' + uuid + i);
            hp.name = "Glenfield Medical Centre";
            hp.phone = "09-444 5911";
            hp.address = "452 Glenfield Road, Glenfield, Auckland 0629";
            hp.publicKey = "";

            hps.push(hp)
        }

        let populated2 = await hpRegistry.exists(hps[0].getIdentifier());
        if (!populated2) {
            await hpRegistry.addAll(hps);

            for (var j = NO_OF_ASSETS - 1; j >=0; j--) {
                let transaction = factory.newTransaction(namespace, 'ShareKey');
                transaction.patient = factory.newRelationship(namespace, 'Patient','P' + uuid);
                transaction.healthProvider = factory.newRelationship(namespace,'HealthProvider', 'HP' + uuid + j);
                transaction.encryptedPatientKeyHPPublic = "";
                await bc.bcObj.submitTransaction(busNetConnections.get('admin'), transaction);
            }
            
            // let pk = factory.newResource(namespace, 'PatientKey', 'PK' + uuid);
            // pk.patient = factory.newRelationship(namespace, 'Patient','P' + uuid);
            // pk.healthProvider = factory.newRelationship(namespace,'HealthProvider', 'HP1');
            // pk.encryptedPatientKeyHPPublic = "";
            // await assetRegistry.add(pk);
            
            // userName = "HP1";
            // logger.debug("here1");

            // let newConnection = await composerUtils.obtainConnectionForParticipant(busNetConnections.get('admin'), busNetName, hp, userName);
            // logger.debug("here2");
            // logger.debug("username: " + userName);
            // logger.debug("id: " + hp.getIdentifier());


            // busNetConnections.set(userName, newConnection);

        }



    } catch (error) {
        logger.error('error in test init(): ', error);
        return Promise.reject(error);
    }
}

module.exports.run = function () {
    // function makeid() {
    //     var text = "";
    //     var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    //     for (var i = 0; i < 6; i++)
    //       text += possible.charAt(Math.floor(Math.random() * possible.length));

    //     return text;
    //   }



    let transaction = factory.newTransaction(namespace, 'AddAllergy');

    // Creates a new record
    let newRecord = factory.newResource(
        namespace,
        "Allergy",
        'R' + uuid + (testAssetNum--)
    );
    newRecord.record_date = "10/11/2007";
    newRecord.record_code = "371883000";
    newRecord.healthProvider = factory.newRelationship(namespace, 'HealthProvider', 'HP' + uuid + 0);
    newRecord.patient = factory.newRelationship(namespace, 'Patient', 'P' + uuid);
    newRecord.allergy_start = "11/03/1995";
    newRecord.allergy_stop = "10/11/2007";
    newRecord.allergy_code = "425525006";
    newRecord.allergy_desc = "Allergy to peanuts";

        logger.debug("testNum: " + testAssetNum);
    transaction.allergy = newRecord;
    logger.debug("Getting username: " + userName);

    return bc.bcObj.submitTransaction(busNetConnections.get('admin'), transaction);
};

module.exports.end = function () {
    return Promise.resolve(true);
};