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
 * Track the meidcal encounter of a patient
 * @param {nz.ac.auckland} MedicalEncounter - the medical encounter to be processed
 * @transaction
 */
// async function updatePatientEncounter(MedicalEncounter) {

//     MedicalEncounter.patient.records = MedicalEncounter.updatedRecords;

//     let assetRegistry = await getAssetRegistry('nz.ac.auckland.Patient');

//     // emit a notification that a medical encounter has occurred
//     let medicalEncounterNotification = getFactory().newEvent('nz.ac.auckland', 'MedicalEncounterNotification');
//     medicalEncounterNotification.patient = MedicalEncounter.patient;
//     emit(medicalEncounterNotification);

//     // persist the state of the commodity
//     await assetRegistry.update(MedicalEncounter.patient);
// }

/**
 * 
 * @param {nz.ac.auckland.ShareKey} shareKey - 
 * @transaction
 */
async function shareAKey(shareKey) {

    let factory = getFactory()

    let assetRegistry = await getAssetRegistry('nz.ac.auckland.PatientKey');

    let shareKeyNotification = factory.newEvent('nz.ac.auckland', 'ShareKeyNotification');

    let patientKey = factory.newResource('nz.ac.auckland', 'PatientKey', makeid())

    patientKey.patient = shareKey.patient
    patientKey.healthProvider = shareKey.healthProvider
    patientKey.encryptedPatientKeyHPPublic = shareKey.encryptedPatientKeyHPPublic


    shareKeyNotification.key= patientKey;
    emit(shareKeyNotification);

    await assetRegistry.add(patientKey)

    let patientAssetRegistry = await getParticipantRegistry('nz.ac.auckland.Patient')

    shareKey.patient.consentedHPs.push(shareKey.healthProvider)

    await patientAssetRegistry.update(shareKey.patient)

    //Must add HP to list of consented health providers

}

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


async function checkAccessToPatientUsingPatientKey(patient, healthProvider) {
    
  let consentedHPs = patient.consentedHPs;

  console.log(patient);
  console.log(healthProvider);
  console.log(healthProvider.getIdentifier());
  console.log(consentedHPs);

  let assetRegistry = await getAssetRegistry('nz.ac.auckland.PatientKey');

  let allKeys = await assetRegistry.getAll();

  for (let n = 0; n < allKeys.length; n++) {
    let key = allKeys[n];

    if(key.patient.getIdentifier() === patient.getIdentifier()){
      return true;
    }
  }

  console.log("All patient keys: " + allKeys);

  let results = await query('selectPatientKey', { p: 'resource:nz.ac.auckland.Patient#' + patient.id, hp: 'resource:nz.ac.auckland.HealthProvider#' + healthProvider.id });

  console.log("Results: " + results);

  if (results.length > 0){
    return true;
  }

  return false;
} 
  
