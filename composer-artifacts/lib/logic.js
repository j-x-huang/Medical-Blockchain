/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
/**
 * Write your transction processor functions here
 */

/**
 * 
 * @param {nz.ac.auckland.ShareKey} shareKey - 
 * @transaction
 */
async function shareAKey(shareKey) {

    let factory = getFactory();

    let assetRegistry = await getAssetRegistry('nz.ac.auckland.PatientKey');

    let shareKeyNotification = factory.newEvent('nz.ac.auckland', 'ShareKeyNotification');

    let patientKey = factory.newResource('nz.ac.auckland', 'PatientKey', makeid());

    patientKey.patient = shareKey.patient;
    patientKey.healthProvider = shareKey.healthProvider;
    patientKey.encryptedPatientKeyHPPublic = shareKey.encryptedPatientKeyHPPublic;


    shareKeyNotification.key= patientKey;
    emit(shareKeyNotification);

    await assetRegistry.add(patientKey);

    let patientAssetRegistry = await getParticipantRegistry('nz.ac.auckland.Patient')

    shareKey.patient.consentedHPs.push(shareKey.healthProvider);

    await patientAssetRegistry.update(shareKey.patient);
    //Must add HP to list of consented health providers

}

/**
 * 
 * @param {nz.ac.auckland.RevokeMedicalRecordsSharing} revokeTransaction - 
 * @transaction
 */
async function revokeMedicalRecordsSharing(revokeTransaction) {

  let factory = getFactory();

  let assetRegistry = await getAssetRegistry('nz.ac.auckland.PatientKey');
  
  let resource = "resource:";

  let patient = revokeTransaction.patient;
  let healthProvider = revokeTransaction.healthProvider;
  
  let results = await query('selectPatientKey', { p: resource + patient.getFullyQualifiedIdentifier(), hp: resource + healthProvider.getFullyQualifiedIdentifier() });

  if(results.length >0){
    
    let patientKey = results[0];
    
    await assetRegistry.remove(patientKey);
    
  }
  
  let consentedHPs = patient.consentedHPs;

  consentedHPs = consentedHPs.filter(item => item !== healthProvider);
  
  patient.consentedHPs = consentedHPs;
  
  let patientAssetRegistry = await getParticipantRegistry('nz.ac.auckland.Patient');
  
  let revokeMedicalRecordsSharingNotification = factory.newEvent('nz.ac.auckland', 'RevokeMedicalRecordsSharingNotification');

  revokeMedicalRecordsSharingNotification.patient = patient;
  revokeMedicalRecordsSharingNotification.healthProvider= healthProvider;
  emit(revokeMedicalRecordsSharingNotification);

  await patientAssetRegistry.update(patient)

}

/**
 * 
 * @param {nz.ac.auckland.RequestRecordSharing} requestRecordSharingTransaction - 
 * @transaction
 */
async function requestRecordSharing(requestRecordSharingTransaction) {

  let requestRecordSharingNotification = getFactory().newEvent('nz.ac.auckland', 'RequestRecordSharingNotification');
  requestRecordSharingNotification.patient = requestRecordSharingTransaction.patient;
  requestRecordSharingNotification.healthProvider = requestRecordSharingTransaction.healthProvider;
  emit(requestRecordSharingNotification);

}

/**
 * 
 * @param {nz.ac.auckland.CreateNewPatient} createNewPatientTransaction - 
 * @transaction
 */
/* async function createNewPatient(createNewPatientTransaction) {

  let factory = getFactory();

  let assetRegistry = await getAssetRegistry('nz.ac.auckland.Patient');

  let createNewPatientNotification = factory.newEvent('nz.ac.auckland', 'CreateNewPatientNotification');



  let patientKey = factory.newResource('nz.ac.auckland', 'PatientKey', makeid())

  patientKey.patient = shareKey.patient
  patientKey.healthProvider = shareKey.healthProvider
  patientKey.encryptedPatientKeyHPPublic = shareKey.encryptedPatientKeyHPPublic


  createNewPatientNotification.patient= createNewPatientTransaction.patient;
  emit(createNewPatientNotification);

  await assetRegistry.add(patientKey)

  let patientAssetRegistry = await getParticipantRegistry('nz.ac.auckland.Patient')

  shareKey.patient.consentedHPs.push(shareKey.healthProvider)

  await patientAssetRegistry.add(newPatient)

  //Must add HP to list of consented health providers

} */

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (var i = 0; i < 7; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
}

function checkAccessToPatient(patient, healthProvider) {
    
    let consentedHPs = patient.consentedHPs;

    console.log(patient);
    console.log(healthProvider);
    console.log(healthProvider.getIdentifier());
    console.log(consentedHPs);
  
    for (var i = 0; i < consentedHPs.length; i++) {

    console.log(consentedHPs[i]);

      if(consentedHPs[i].getIdentifier() === healthProvider.getIdentifier()){

        return true;

      }

    }
  
    return false;
}


function checkAccessToPatientUsingPatientKey(patient, healthProvider) {
    
  /* let consentedHPs = patient.consentedHPs;

  console.log(patient);
  console.log(healthProvider);
  console.log(healthProvider.getIdentifier());
  console.log(consentedHPs);

  let assetRegistry = getAssetRegistry('nz.ac.auckland.PatientKey');

  let allKeys = assetRegistry.getAll();

  for (let n = 0; n < allKeys.length; n++) {
    let key = allKeys[n];

    if(key.patient.getIdentifier() === patient.getIdentifier()){
      return true;
    }
  }
  
  console.log("All patient keys: ");

  console.log(allKeys); */
  
  let assetRegistry = getAssetRegistry('nz.ac.auckland.PatientKey');
  
  let patientId = "resource:nz.ac.auckland.Patient#" + patient.id;
  
  let healthProviderId = "resource:nz.ac.auckland.HealthProvider#" + healthProvider.id;

  let results = query('selectAllPatientKeys');
  
  /* if (results.length > 0){
    return true;
  } */
  
  for (let n = 0; n < results.length; n++) {
        if(results[n].healthProvider.getIdentifier() === healthProvider.getIdentifier()){
           return true;
        }
  }
  
  if(results.length > 0){
  	return true;
  }

  return false;
}
  
