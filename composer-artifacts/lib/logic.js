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

 /**
 * Write your transction processor functions here
 */

/**
 * This is the transaction function for the ShareKey transaction.
 * It gives a patient's consent to a healthcare provider for accessing the patient's health records.
 *
 * @param {nz.ac.auckland.ShareKey} shareKey -
 * @transaction
 */
async function shareAKey(shareKey) {
  let factory = getFactory();

  let assetRegistry = await getAssetRegistry("nz.ac.auckland.PatientKey");

  let resource = "resource:";

  let patient = shareKey.patient;
  let healthProvider = shareKey.healthProvider;

  // eslint-disable-next-line
  let results = await query("selectPatientKey", {
    p: resource + patient.getFullyQualifiedIdentifier(),
    hp: resource + healthProvider.getFullyQualifiedIdentifier()
  });

  // If there is a patient key asset that already exists then cancel the transaction and throw an error
  if (results.length > 0) {
    throw new Error(
      "Already shared patient key with healthcare provider: " +
        healthProvider.name +
        "!"
    );
  }

  // Creates a ShareKey transaction notification
  let shareKeyNotification = factory.newEvent(
    "nz.ac.auckland",
    "ShareKeyNotification"
  );

  // Create a new patient key asset
  let patientKey = factory.newResource(
    "nz.ac.auckland",
    "PatientKey",
    "" + patient.getIdentifier() + healthProvider.getIdentifier()
  );

  patientKey.patient = shareKey.patient;
  patientKey.healthProvider = shareKey.healthProvider;
  patientKey.encryptedPatientKeyHPPublic = shareKey.encryptedPatientKeyHPPublic;

  shareKeyNotification.patient = shareKey.patient;
  shareKeyNotification.healthProvider = shareKey.healthProvider;

  // Push the notification about the transaction
  emit(shareKeyNotification);

  // Add the new patient key to the blockchain ledger
  await assetRegistry.add(patientKey);

  let patientAssetRegistry = await getParticipantRegistry(
    "nz.ac.auckland.Patient"
  );

  // Add the healthcare provider to the consent list of the patient who submitted the transaction
  shareKey.patient.consentedHPs.push(shareKey.healthProvider);

  await patientAssetRegistry.update(shareKey.patient);
}

/**
 * This is the transaction function for the AddAllergy transaction.
 *
 * @param {nz.ac.auckland.AddAllergy} allergyTx -
 * @transaction
 */
async function addAllergy(allergyTx) {
  let assetRegistry = await getAssetRegistry('nz.ac.auckland.Allergy');

  await assetRegistry.add(allergyTx.allergy);
}

/**
 * This is the transaction function for the RevokeMedicalRecordsSharing transaction.
 * It revokes a patient's consent given to a healthcare provider.
 *
 * @param {nz.ac.auckland.RevokeMedicalRecordsSharing} revokeTransaction -
 * @transaction
 */
async function revokeMedicalRecordsSharing(revokeTransaction) {
  let factory = getFactory();

  let assetRegistry = await getAssetRegistry("nz.ac.auckland.PatientKey");

  let resource = "resource:";

  let patient = revokeTransaction.patient;
  let healthProvider = revokeTransaction.healthProvider;

  // eslint-disable-next-line
  let results = await query("selectPatientKey", {
    p: resource + patient.getFullyQualifiedIdentifier(),
    hp: resource + healthProvider.getFullyQualifiedIdentifier()
  });

  // Deletes all patient keys related to the patient and healthcare provider in the transaction
  if (results.length > 0) {
    for (var i = 0; i < results.length; i++) {
      await assetRegistry.remove(results[i]);
    }
  } else {
    throw new Error("No patient key for this Healthcare provider found!");
  }

  let consentedHPs = patient.consentedHPs;

  // Remove the healthcare provider from the consent list of the patient in the transcation
  consentedHPs = consentedHPs.filter(item => item !== healthProvider);

  patient.consentedHPs = consentedHPs;

  let patientAssetRegistry = await getParticipantRegistry(
    "nz.ac.auckland.Patient"
  );

  // Creates a revoke consent notification
  let revokeMedicalRecordsSharingNotification = factory.newEvent(
    "nz.ac.auckland",
    "RevokeMedicalRecordsSharingNotification"
  );

  // Emits the notification
  revokeMedicalRecordsSharingNotification.patient = patient;
  revokeMedicalRecordsSharingNotification.healthProvider = healthProvider;
  emit(revokeMedicalRecordsSharingNotification);

  // Update the patient on the blockchain ledger
  await patientAssetRegistry.update(patient);
}

/**
 * This is the transaction function for the RequestRecordSharing transaction.
 * It emits a notfication to the patient about the consent request from the healthcare provider.
 *
 * @param {nz.ac.auckland.RequestRecordSharing} requestRecordSharingTransaction -
 * @transaction
 */
async function requestRecordSharing(requestRecordSharingTransaction) {
  // Creates the notification and emits it.
  let requestRecordSharingNotification = getFactory().newEvent(
    "nz.ac.auckland",
    "RequestRecordSharingNotification"
  );
  requestRecordSharingNotification.patient =
    requestRecordSharingTransaction.patient;
  requestRecordSharingNotification.healthProvider =
    requestRecordSharingTransaction.healthProvider;
  emit(requestRecordSharingNotification);
}

/**
 * This function checks whether a patient gave a healthcare provider consent
 * by checking whether the healthcare provider is in the patient's consent list.
 * It is used the by access control rules to check consent.
 *
 */
function checkAccessToPatient(patient, healthProvider) {
  let consentedHPs = patient.consentedHPs;

  for (var i = 0; i < consentedHPs.length; i++) {
    if (consentedHPs[i].getIdentifier() === healthProvider.getIdentifier()) {
      return true;
    }
  }

  return false;
}

/**
 * This function checks whether a patient gave a healthcare provider consent by
 * checking whether there is a patient key between the patient and the healthcare provider.
 * It currently does not work.
 *
 */
function checkAccessToPatientUsingPatientKey(patient, healthProvider) {
  let assetRegistry = getAssetRegistry("nz.ac.auckland.PatientKey");

  let patientId = "resource:nz.ac.auckland.Patient#" + patient.id;

  let healthProviderId =
    "resource:nz.ac.auckland.HealthProvider#" + healthProvider.id;

  // eslint-disable-next-line
  let results = query("selectAllPatientKeys");

  for (let n = 0; n < results.length; n++) {
    if (
      results[n].healthProvider.getIdentifier() ===
      healthProvider.getIdentifier()
    ) {
      return true;
    }
  }

  if (results.length > 0) {
    return true;
  }

  return false;
}
