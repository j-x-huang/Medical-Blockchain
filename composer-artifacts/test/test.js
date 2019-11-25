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
 * Write the unit tests for your transction processor functions here
 */

const AdminConnection = require("composer-admin").AdminConnection;
const BusinessNetworkConnection = require("composer-client")
  .BusinessNetworkConnection;
const {
  BusinessNetworkDefinition,
  CertificateUtil,
  IdCard
} = require("composer-common");
const path = require("path");

const chai = require("chai");
const encryption = require("./encryption");
chai.should();
chai.use(require("chai-as-promised"));

const namespace = "nz.ac.auckland";
const assetType = "Patient";
const assetNS = namespace + "." + assetType;
// const participantType = 'HealthProvider';
// const participantNS = namespace + '.' + participantType;
const healthProviderParticipantType = "HealthProvider";
const healthProviderParticipantNS =
  namespace + "." + healthProviderParticipantType;
const patientParticipantType = "Patient";
const patientParticipantNS = namespace + "." + patientParticipantType;
const allergyRecordAssetType = "Allergy";
const allergyRecordAssetNS = namespace + "." + allergyRecordAssetType;
const requestRecordSharingTransactionType = "RequestRecordSharing";
const requestRecordSharingTransactionNS =
  namespace + "." + requestRecordSharingTransactionType;
const recordSharingTransactionType = "ShareKey";
const recordSharingTransactionNS =
  namespace + "." + recordSharingTransactionType;
const patientKeyAssetType = "PatientKey";
const patientKeyAssetNS = namespace + "." + patientKeyAssetType;
const revokeMedicalRecordsSharingTransactionType =
  "RevokeMedicalRecordsSharing";
const revokeMedicalRecordsSharingTransactionNS =
  namespace + "." + revokeMedicalRecordsSharingTransactionType;
const keySize = 512;

var nshPublicKey = "";
var nshPrivateKey = "";
var gmcPublicKey = "";
var gmcPrivateKey = "";
var p1PublicKey = "";
var p1PrivateKey = "";
var p1PatientKey = "";
var p2PublicKey = "";
var p2PrivateKey = "";
var p2PatientKey = "";

describe("#" + namespace, () => {
  // In-memory card store for testing so cards are not persisted to the file system
  const cardStore = require("composer-common").NetworkCardStoreManager.getCardStore(
    { type: "composer-wallet-inmemory" }
  );

  // Embedded connection used for local testing
  const connectionProfile = {
    name: "embedded",
    "x-type": "embedded"
  };

  // Name of the business network card containing the administrative identity for the business network
  const adminCardName = "admin";

  // Admin connection to the blockchain, used to deploy the business network
  let adminConnection;

  // This is the business network connection the tests will use.
  let businessNetworkConnection;

  // This is the factory for creating instances of types.
  let factory;

  // These are the identities for the participants.
  const nshCardName = "nsh";
  const gmcCardName = "gmc";
  const p1CardName = "ea";
  const p2CardName = "mmc";

  // These are a list of receieved events.
  let events;

  let businessNetworkName;

  before(async () => {
    // Generate certificates for use with the embedded connection
    const credentials = CertificateUtil.generate({ commonName: "admin" });

    // Identity used with the admin connection to deploy business networks
    const deployerMetadata = {
      version: 1,
      userName: "PeerAdmin",
      roles: ["PeerAdmin", "ChannelAdmin"]
    };
    const deployerCard = new IdCard(deployerMetadata, connectionProfile);
    deployerCard.setCredentials(credentials);
    const deployerCardName = "PeerAdmin";

    adminConnection = new AdminConnection({ cardStore: cardStore });

    await adminConnection.importCard(deployerCardName, deployerCard);
    await adminConnection.connect(deployerCardName);
  });

  /**
   *
   * @param {String} cardName The card name to use for this identity
   * @param {Object} identity The identity details
   */
  async function importCardForIdentity(cardName, identity) {
    const metadata = {
      userName: identity.userID,
      version: 1,
      enrollmentSecret: identity.userSecret,
      businessNetwork: businessNetworkName
    };
    const card = new IdCard(metadata, connectionProfile);
    await adminConnection.importCard(cardName, card);
  }

  // This is called before each test is executed.
  beforeEach(async () => {
    // Generate a business network definition from the project directory.
    let businessNetworkDefinition = await BusinessNetworkDefinition.fromDirectory(
      path.resolve(__dirname, "..")
    );
    businessNetworkName = businessNetworkDefinition.getName();
    await adminConnection.install(businessNetworkDefinition);
    const startOptions = {
      networkAdmins: [
        {
          userName: "admin",
          enrollmentSecret: "adminpw"
        }
      ]
    };
    const adminCards = await adminConnection.start(
      businessNetworkName,
      businessNetworkDefinition.getVersion(),
      startOptions
    );
    await adminConnection.importCard(adminCardName, adminCards.get("admin"));

    // Create and establish a business network connection
    businessNetworkConnection = new BusinessNetworkConnection({
      cardStore: cardStore
    });
    events = [];
    businessNetworkConnection.on("event", event => {
      events.push(event);
    });
    await businessNetworkConnection.connect(adminCardName);

    // Get the factory for the business network.
    factory = businessNetworkConnection.getBusinessNetwork().getFactory();

    const participantRegistryHP = await businessNetworkConnection.getParticipantRegistry(
      healthProviderParticipantNS
    );
    // Create the participants.
    const nsh = factory.newResource(
      namespace,
      healthProviderParticipantType,
      "H1"
    );
    nsh.name = "North Shore Hospital";
    nsh.phone = "09-486 8900";
    nsh.address = "124 Shakespeare Rd, Takapuna, Auckland 0620";

    var nshKeys = encryption.generateRSAkeys(keySize);
    nsh.publicKey = nshKeys.publicKey;
    nshPublicKey = nshKeys.publicKey;
    nshPrivateKey = nshKeys.privateKey;

    const gmc = factory.newResource(
      namespace,
      healthProviderParticipantType,
      "H2"
    );
    gmc.name = "Glenfield Medical Centre";
    gmc.phone = "09-444 5911";
    gmc.address = "452 Glenfield Road, Glenfield, Auckland 0629";

    var gmcKeys = encryption.generateRSAkeys(keySize);
    gmc.publicKey = gmcKeys.publicKey;
    gmcPublicKey = gmcKeys.publicKey;
    gmcPrivateKey = gmcKeys.privateKey;

    await participantRegistryHP.addAll([nsh, gmc]);

    const participantRegistryPatient = await businessNetworkConnection.getParticipantRegistry(
      patientParticipantNS
    );

    const patient1 = factory.newResource(
      namespace,
      patientParticipantType,
      "P1"
    );
    patient1.birthDate = "19/4/1994";
    patient1.prefix = "Mr.";
    patient1.first = "Emmanuel";
    patient1.last = "Adams";
    patient1.ethinicity = "irish";
    patient1.gender = "Male";
    patient1.address = "53 Kristopher Springs Suite 264 Whitman MA 02382 US";
    patient1.consentedHPs = [];

    var p1Keys = encryption.generateRSAkeys(keySize);
    patient1.publicKey = p1Keys.publicKey;
    p1PublicKey = p1Keys.publicKey;
    p1PrivateKey = p1Keys.privateKey;

    p1PatientKey = encryption.generateRandomKey();

    const patient2 = factory.newResource(
      namespace,
      patientParticipantType,
      "P2"
    );
    patient2.birthDate = "1/6/1985";
    patient2.prefix = "Ms.";
    patient2.first = "Martha";
    patient2.last = "McCullough";
    patient2.ethinicity = "chinese";
    patient2.gender = "Female";
    patient2.address = "7 Wiley Points Newburyport MA 01951 US";
    patient2.consentedHPs = [];

    var p2Keys = encryption.generateRSAkeys(keySize);
    patient2.publicKey = p2Keys.publicKey;
    p2PublicKey = p2Keys.publicKey;
    p2PrivateKey = p2Keys.privateKey;

    p2PatientKey = encryption.generateRandomKey();

    await participantRegistryPatient.addAll([patient1, patient2]);

    // Issue identities for the particiapnts.
    let identity = await businessNetworkConnection.issueIdentity(
      healthProviderParticipantNS + "#H1",
      "NSH"
    );
    await importCardForIdentity(nshCardName, identity);
    identity = await businessNetworkConnection.issueIdentity(
      healthProviderParticipantNS + "#H2",
      "GMC"
    );
    await importCardForIdentity(gmcCardName, identity);
    identity = await businessNetworkConnection.issueIdentity(
      patientParticipantNS + "#P1",
      "EmmanuelAdams"
    );
    await importCardForIdentity(p1CardName, identity);
    identity = await businessNetworkConnection.issueIdentity(
      patientParticipantNS + "#P2",
      "MarthaMcCullough"
    );
    await importCardForIdentity(p2CardName, identity);
  });

  /**
   * Reconnect using a different identity.
   * @param {String} cardName The name of the card for the identity to use
   */
  async function useIdentity(cardName) {
    await businessNetworkConnection.disconnect();
    businessNetworkConnection = new BusinessNetworkConnection({
      cardStore: cardStore
    });
    events = [];
    businessNetworkConnection.on("event", event => {
      events.push(event);
    });
    await businessNetworkConnection.connect(cardName);
    factory = businessNetworkConnection.getBusinessNetwork().getFactory();
  }

  it("Patients can see all healthcare providers", async () => {
    // Use the identity for Emmanuel Adams.
    await useIdentity(p1CardName);
    const participantRegistry = await businessNetworkConnection.getParticipantRegistry(
      healthProviderParticipantNS
    );
    const participants = await participantRegistry.getAll();

    // Validate that the retreived healthcare providers are correct.
    participants.should.have.lengthOf(2);
    const participant1 = participants[0];
    participant1.id.should.equal("H1");
    participant1.name.should.equal("North Shore Hospital");
    participant1.phone.should.equal("09-486 8900");
    participant1.address.should.equal(
      "124 Shakespeare Rd, Takapuna, Auckland 0620"
    );
    participant1.publicKey.should.equal(nshPublicKey);
    const participant2 = participants[1];
    participant2.id.should.equal("H2");
    participant2.name.should.equal("Glenfield Medical Centre");
    participant2.phone.should.equal("09-444 5911");
    participant2.address.should.equal(
      "452 Glenfield Road, Glenfield, Auckland 0629"
    );
    participant2.publicKey.should.equal(gmcPublicKey);
  });

  it("Patients can only read their own patient data", async () => {
    // Use the identity for Emmanuel Adams.
    await useIdentity(p1CardName);
    const participantRegistry = await businessNetworkConnection.getParticipantRegistry(
      patientParticipantNS
    );
    const participants = await participantRegistry.getAll();

    // Validate the participant data.
    participants.should.have.lengthOf(1);
    const participant = participants[0];
    participant.id.should.equal("P1");
    participant.birthDate.should.equal("19/4/1994");
    participant.prefix.should.equal("Mr.");
    participant.first.should.equal("Emmanuel");
    participant.last.should.equal("Adams");
    participant.ethinicity.should.equal("irish");
    participant.gender.should.equal("Male");
    participant.address.should.equal(
      "53 Kristopher Springs Suite 264 Whitman MA 02382 US"
    );
    participant.publicKey.should.equal(p1PublicKey);
  });

  it("Patients cannot create new patients", async () => {
    // Use the identity for Emmanuel Adams.
    await useIdentity(p1CardName);
    const participantRegistry = await businessNetworkConnection.getParticipantRegistry(
      patientParticipantNS
    );

    // Create a new patient participant
    const newPatient = factory.newResource(
      namespace,
      patientParticipantType,
      "P2"
    );
    newPatient.birthDate = "1/6/1985";
    newPatient.prefix = "Ms.";
    newPatient.first = "Martha";
    newPatient.last = "McCullough";
    newPatient.ethinicity = "chinese";
    newPatient.gender = "Female";
    newPatient.address = "7 Wiley Points Newburyport MA 01951 US";

    var npKeys = encryption.generateRSAkeys(keySize);
    newPatient.publicKey = npKeys.publicKey;

    newPatient.consentedHPs = [];

    // Attempts to add the participant to the blockchain ledger and validates that it is rejected.
    await participantRegistry
      .add(newPatient)
      .should.be.rejectedWith(/does not have .* access to resource/);
  });

  it("Patients cannot add health records", async () => {
    // Use the identity for Martha.
    await useIdentity(p2CardName);
    const assetRegistry = await businessNetworkConnection.getAssetRegistry(
      allergyRecordAssetNS
    );

    // Creates a new allergy record
    const record1 = factory.newResource(
      namespace,
      allergyRecordAssetType,
      "R1"
    );
    record1.record_date = "10/11/2007";
    record1.record_code = "371883000";
    record1.healthProvider = factory.newRelationship(
      namespace,
      healthProviderParticipantType,
      "H1"
    );
    record1.patient = factory.newRelationship(
      namespace,
      patientParticipantType,
      "P2"
    );
    record1.allergy_start = "11/03/1995";
    record1.allergy_stop = "10/11/2007";
    record1.allergy_code = "425525006";
    record1.allergy_desc = "Allergy to dairy product";

    // Attempts to add the record to the blockchain ledger and validates that it is rejected.
    await assetRegistry
      .add(record1)
      .should.be.rejectedWith(/does not have .* access to resource/);
  });

  it("Healthcare providers cannot view unconsented patients", async () => {
    // Use the identity for Glenfield Medical Center.
    await useIdentity(gmcCardName);
    const participantRegistry = await businessNetworkConnection.getParticipantRegistry(
      patientParticipantNS
    );
    const participants = await participantRegistry.getAll();

    // Validates that no patients are retrieved.
    participants.should.have.lengthOf(0);
  });

  it("Healthcare providers can view other healthcare providers", async () => {
    // Use the identity for Glenfield Medical Center.
    await useIdentity(gmcCardName);
    const participantRegistry = await businessNetworkConnection.getParticipantRegistry(
      healthProviderParticipantNS
    );
    const participants = await participantRegistry.getAll();

    // Validate the participant data.
    participants.should.have.lengthOf(2);
    const participant1 = participants[0];
    participant1.id.should.equal("H1");
    participant1.name.should.equal("North Shore Hospital");
    participant1.phone.should.equal("09-486 8900");
    participant1.address.should.equal(
      "124 Shakespeare Rd, Takapuna, Auckland 0620"
    );
    participant1.publicKey.should.equal(nshPublicKey);
    const participant2 = participants[1];
    participant2.id.should.equal("H2");
    participant2.name.should.equal("Glenfield Medical Centre");
    participant2.phone.should.equal("09-444 5911");
    participant2.address.should.equal(
      "452 Glenfield Road, Glenfield, Auckland 0629"
    );
    participant2.publicKey.should.equal(gmcPublicKey);
  });

  it("Healthcare providers cannot create new patients", async () => {
    // Use the identity for Glenfield Medical Center.
    await useIdentity(gmcCardName);
    const participantRegistry = await businessNetworkConnection.getParticipantRegistry(
      patientParticipantNS
    );

    // Create a new patient participant object
    const newPatient = factory.newResource(
      namespace,
      patientParticipantType,
      "P3"
    );
    newPatient.birthDate = "1/6/1985";
    newPatient.prefix = "Ms.";
    newPatient.first = "GMC";
    newPatient.last = "GMC";
    newPatient.ethinicity = "chinese";
    newPatient.gender = "Female";
    newPatient.address = "7 Wiley Points Newburyport MA 01951 US";

    var npKeys = encryption.generateRSAkeys(keySize);
    newPatient.publicKey = npKeys.publicKey;

    newPatient.consentedHPs = [];

    // Attempts to add the patient to the blockchain ledger and validates that it is rejected.
    await participantRegistry
      .add(newPatient)
      .should.be.rejectedWith(/does not have .* access to resource/);
  });

  it("Healthcare providers can send a record sharing request to a patient", async () => {
    // Use the identity for North Shore Hosiptal.
    await useIdentity(nshCardName);

    // Submit the transaction.
    const transaction = factory.newTransaction(
      namespace,
      requestRecordSharingTransactionType
    );
    transaction.healthProvider = factory.newRelationship(
      namespace,
      healthProviderParticipantType,
      "H1"
    );
    transaction.patient = factory.newRelationship(
      namespace,
      patientParticipantType,
      "P2"
    );
    await businessNetworkConnection.submitTransaction(transaction);

    // Validate the event.
    events.should.have.lengthOf(1);
    const event = events[0];
    event.eventId.should.be.a("string");
    event.timestamp.should.be.an.instanceOf(Date);
    event.healthProvider
      .getFullyQualifiedIdentifier()
      .should.equal(healthProviderParticipantNS + "#H1");
    event.patient
      .getFullyQualifiedIdentifier()
      .should.equal(patientParticipantNS + "#P2");
  });

  it("Healthcare providers cannot send a record sharing request with a different healthcare provider identity", async () => {
    // Use the identity for North Shore Hosiptal.
    await useIdentity(nshCardName);

    // Create the transaction
    const transaction = factory.newTransaction(
      namespace,
      requestRecordSharingTransactionType
    );

    // Use identity/ID of healthcare provider 2 (Glenfield Medical Center)
    transaction.healthProvider = factory.newRelationship(
      namespace,
      healthProviderParticipantType,
      "H2"
    );
    transaction.patient = factory.newRelationship(
      namespace,
      patientParticipantType,
      "P2"
    );

    // Submit the transaction and validates that it is rejected
    await businessNetworkConnection
      .submitTransaction(transaction)
      .should.be.rejectedWith(/does not have .* access to resource/);
  });

  it("Heathcare providers cannot add health records to unconsented patients", async () => {
    // Use the identity for North Shore Hosiptal.
    await useIdentity(nshCardName);

    const assetRegistry = await businessNetworkConnection.getAssetRegistry(
      allergyRecordAssetNS
    );

    // Creates a new record
    const newRecord = factory.newResource(
      namespace,
      allergyRecordAssetType,
      "R1"
    );
    newRecord.record_date = "10/11/2007";
    newRecord.record_code = "371883000";
    newRecord.healthProvider = factory.newRelationship(
      namespace,
      healthProviderParticipantType,
      "H1"
    );
    newRecord.patient = factory.newRelationship(
      namespace,
      patientParticipantType,
      "P2"
    );
    newRecord.allergy_start = "11/03/1995";
    newRecord.allergy_stop = "10/11/2007";
    newRecord.allergy_code = "425525006";
    newRecord.allergy_desc = "Allergy to dairy product";

    // Attempts to add the new record to the blockchain ledger and validates that it is rejected.
    await assetRegistry
      .add(newRecord)
      .should.be.rejectedWith(/does not have .* access to resource/);
  });

  it("Patients can share records with healthcare providers, healthcare providers can view/add records for consented patients, patients can revoke consent", async () => {
    // Pre-defined values for a health record about allergy
    const allergyRecord = {};
    allergyRecord.record_date = "10/11/2007";
    allergyRecord.record_code = "371883000";
    allergyRecord.allergy_start = "11/03/1995";
    allergyRecord.allergy_stop = "10/11/2007";
    allergyRecord.allergy_code = "425525006";
    allergyRecord.allergy_desc = "Allergy to dairy product";

    // Use the identity for Martha (patient 2)
    await useIdentity(p2CardName);

    // Create the record sharing transaction
    const recordSharingTransaction = factory.newTransaction(
      namespace,
      recordSharingTransactionType
    );
    recordSharingTransaction.healthProvider = factory.newRelationship(
      namespace,
      healthProviderParticipantType,
      "H1"
    );
    recordSharingTransaction.patient = factory.newRelationship(
      namespace,
      patientParticipantType,
      "P2"
    );
    recordSharingTransaction.encryptedPatientKeyHPPublic = encryption.asymEncrypt(
      p2PatientKey,
      nshPublicKey
    );

    // Submit the record sharing transaction
    await businessNetworkConnection.submitTransaction(recordSharingTransaction);

    // Switch to Northshore Hospital
    await useIdentity(nshCardName);

    const patientKeyAssetRegistry = await businessNetworkConnection.getAssetRegistry(
      patientKeyAssetNS
    );

    const patientKeys = await patientKeyAssetRegistry.getAll();

    // Validate whether a shared patient key from Martha (p2) is created
    patientKeys.should.have.lengthOf(1);
    const patientKey = patientKeys[0];

    patientKey.healthProvider
      .getFullyQualifiedIdentifier()
      .should.equal(healthProviderParticipantNS + "#H1");
    patientKey.patient
      .getFullyQualifiedIdentifier()
      .should.equal(patientParticipantNS + "#P2");

    const patientParticipantRegistry = await businessNetworkConnection.getParticipantRegistry(
      patientParticipantNS
    );

    const patients = await patientParticipantRegistry.getAll();

    // Validate whether the healthcare provider could read patient data of Martha (p2)
    patients.should.have.lengthOf(1);
    const p2 = patients[0];
    p2.id.should.equal("P2");
    p2.first.should.equal("Martha");

    const recordAssetRegistryHP = await businessNetworkConnection.getAssetRegistry(
      allergyRecordAssetNS
    );

    // Decrypt the Martha's patient key
    const symKeyMartha = encryption.asymDecrypt(
      patientKey.encryptedPatientKeyHPPublic,
      nshPrivateKey
    );

    // Create a new allergy health record for Martha and encrypt the fields with her patient key
    const record = factory.newResource(namespace, allergyRecordAssetType, "R1");
    record.record_date = encryption.symEncrypt(
      allergyRecord.record_date,
      symKeyMartha
    );
    record.record_code = encryption.symEncrypt(
      allergyRecord.record_code,
      symKeyMartha
    );
    record.healthProvider = factory.newRelationship(
      namespace,
      healthProviderParticipantType,
      "H1"
    );
    record.patient = factory.newRelationship(
      namespace,
      patientParticipantType,
      "P2"
    );
    record.allergy_start = encryption.symEncrypt(
      allergyRecord.allergy_start,
      symKeyMartha
    );
    record.allergy_stop = encryption.symEncrypt(
      allergyRecord.allergy_stop,
      symKeyMartha
    );
    record.allergy_code = encryption.symEncrypt(
      allergyRecord.allergy_code,
      symKeyMartha
    );
    record.allergy_desc = encryption.symEncrypt(
      allergyRecord.allergy_desc,
      symKeyMartha
    );

    // Add the new health record
    await recordAssetRegistryHP.add(record);

    // Validate that the record has been added
    const recordsHP = await recordAssetRegistryHP.getAll();
    recordsHP.should.have.lengthOf(1);

    // Use the identity for Martha.
    await useIdentity(p2CardName);

    const recordAssetRegistryPatient = await businessNetworkConnection.getAssetRegistry(
      allergyRecordAssetNS
    );

    // Validate the record added by the healthcare provider (Northshore Hospital)
    const recordsPatient = await recordAssetRegistryPatient.getAll();
    recordsPatient.should.have.lengthOf(1);
    const retrievedRecord = recordsPatient[0];

    // Validate that the decrypted fields has the correct value
    retrievedRecord.healthProvider
      .getFullyQualifiedIdentifier()
      .should.equal(healthProviderParticipantNS + "#H1");

    retrievedRecord.patient
      .getFullyQualifiedIdentifier()
      .should.equal(patientParticipantNS + "#P2");

    encryption
      .symDecrypt(retrievedRecord.record_date, p2PatientKey)
      .should.equal(allergyRecord.record_date);
    encryption
      .symDecrypt(retrievedRecord.record_code, p2PatientKey)
      .should.equal(allergyRecord.record_code);
    encryption
      .symDecrypt(retrievedRecord.allergy_start, p2PatientKey)
      .should.equal(allergyRecord.allergy_start);
    encryption
      .symDecrypt(retrievedRecord.allergy_stop, p2PatientKey)
      .should.equal(allergyRecord.allergy_stop);
    encryption
      .symDecrypt(retrievedRecord.allergy_code, p2PatientKey)
      .should.equal(allergyRecord.allergy_code);
    encryption
      .symDecrypt(retrievedRecord.allergy_desc, p2PatientKey)
      .should.equal(allergyRecord.allergy_desc);

    // Create a transaction to revoke consent/record sharing
    const revokeMedicalRecordsSharingTransaction = factory.newTransaction(
      namespace,
      revokeMedicalRecordsSharingTransactionType
    );
    revokeMedicalRecordsSharingTransaction.healthProvider = factory.newRelationship(
      namespace,
      healthProviderParticipantType,
      "H1"
    );
    revokeMedicalRecordsSharingTransaction.patient = factory.newRelationship(
      namespace,
      patientParticipantType,
      "P2"
    );

    // Submit the record sharing revocation transaction
    await businessNetworkConnection.submitTransaction(
      revokeMedicalRecordsSharingTransaction
    );

    // Switch to healthcare provider Northshore Hospital
    await useIdentity(nshCardName);

    const patientParticipantRegistryAfterRecordSharingRevocation = await businessNetworkConnection.getParticipantRegistry(
      patientParticipantNS
    );

    // Validates that the healthcare provider Northshore Hospital no longer has access to Martha's (patient 2) patient data and health records after record sharing revocation
    const patientsHPAfterRecordSharingRevocation = await patientParticipantRegistryAfterRecordSharingRevocation.getAll();

    patientsHPAfterRecordSharingRevocation.should.have.lengthOf(0);

    const recordAssetRegistryAfterRecordSharingRevocation = await businessNetworkConnection.getAssetRegistry(
      allergyRecordAssetNS
    );

    const recordsHPAfterRecordSharingRevocation = await recordAssetRegistryAfterRecordSharingRevocation.getAll();

    recordsHPAfterRecordSharingRevocation.should.have.lengthOf(0);
  });

  it("Patients cannot share records with healthcare providers using identities of other patients", async () => {
    // Use the identity for Martha (patient 2)
    await useIdentity(p2CardName);

    // Create the record sharing transaction
    const recordSharingTransaction = factory.newTransaction(
      namespace,
      recordSharingTransactionType
    );
    recordSharingTransaction.healthProvider = factory.newRelationship(
      namespace,
      healthProviderParticipantType,
      "H1"
    );
    // Use identity of patient 1 (Emmanuel Adams) for the transaction
    recordSharingTransaction.patient = factory.newRelationship(
      namespace,
      patientParticipantType,
      "P1"
    );
    recordSharingTransaction.encryptedPatientKeyHPPublic = encryption.asymEncrypt(
      p2PatientKey,
      nshPublicKey
    );

    // Submit the record sharing transaction and validates that it is rejected
    await businessNetworkConnection
      .submitTransaction(recordSharingTransaction)
      .should.be.rejectedWith(/does not have .* access to resource/);
  });
});
