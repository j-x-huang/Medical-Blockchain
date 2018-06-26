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
 * @param {nz.ac.auckland.medical_encounter} medical_encounter - the medical encounter to be processed
 * @transaction
 */
async function updatePatientEncounter(medical_encounter) {

    let assetRegistry = await getAssetRegistry('nz.ac.auckland.Patient');

    // emit a notification that a medical encounter has occurred
    let medicalEncounterNotification = getFactory().newEvent('nz.ac.auckland', 'MedicalEncounterNotification');
    medicalEncounterNotification.patient = medical_encounter.patient;
    emit(medicalEncounterNotification);

    // persist the state of the commodity
    await assetRegistry.update(medical_encounter.patient);
}

/**
 * Remove a patient
 * @param {nz.ac.auckland.remove_patient} remove - the remove to be processed
 * @transaction
 */
async function removePatient(remove) {

    let assetRegistry = await getAssetRegistry('nz.ac.auckland.Patient');

    let results = await query('selectPatientByID', { inputValue: remove.patient.pid });

    for (let n = 0; n < results.length; n++) {
        let patient = results[n];

        // emit a notification that a trade was removed
        let removeNotification = getFactory().newEvent('nz.ac.auckland','RemoveNotification');
        removeNotification.patient = patient;
        emit(removeNotification);
        await assetRegistry.remove(patient);
    }
}
