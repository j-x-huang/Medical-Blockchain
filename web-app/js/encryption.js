
const_publicKey = '';

const_privateKey = '';

function loaded() {
  //var buf = crypto.randomBytes(1024 / 8) // 128 bytes
  //buf = new Uint32Array(new Uint8Array(buf).buffer)

  //sjcl.random.addEntropy(buf, 1024, "crypto.randomBytes")

  sjcl.random.startCollectors();
}


function getRandomSalt(words, paranoia) {

  console.log("Computing salt"); 
  var salt = sjcl.random.randomWords(words, paranoia);
  console.log(salt); 

  salt = sjcl.codec.base64.fromBits(salt);

  console.log(salt);

  return salt;
}

function kdf(password, salt){

   console.log("Password: " + password);

   var iterations = 10000;

   var keyLength = 256;

   if (password.length == 0) {
      error("Need a password!");
      return;
   }

   var keyBitArray = sjcl.misc.pbkdf2(password, salt, iterations, keyLength);

   var key = sjcl.codec.hex.fromBits(keyBitArray);

   console.log(key);

   return key;
}

function symEncrypt(data, key){

  /* console.log("Encrypting data: Data = " + data + " Key = " + key);

   if (data === '') { return ''; }
   if (key.length == 0) {
     error("Need a key!");
     return;
   }

  key = sjcl.codec.hex.toBits(key);

   // Key must be in bit array
   var result = sjcl.encrypt(key, data, {iv : iv, mode : "ccm"});

   console.log(result);*/

   var encrypted = CryptoJS.AES.encrypt(data, key);

   console.log("Encrypted: " + encrypted);

   return encrypted;
}


function symDecrypt(encryptedData, key){

   /* if (encryptedData.length === 0) { return ''; }
   if (key.length == 0) {
     error("Need a key!");
     return;
   }
   if (iv.length === 0) {
    error("Can't decrypt: need an IV!"); return;
   }

   key = sjcl.codec.hex.toBits(key);

   key = new sjcl.cipher.aes(key);

   initialisationVector = sjcl.codec.base64.toBits(iv);

   encryptedData = sjcl.codec.base64.toBits(encryptedData);

   var data = sjcl.codec.utf8String.fromBits(sjcl.mode.ccm.decrypt(key, encryptedData, initialisationVector));

   console.log(data); */

   console.log("Encrypted: " + encryptedData);

   var decrypted = CryptoJS.AES.decrypt(encryptedData, key);

   console.log("Decrypted binary: " + decrypted);

   decrypted = decrypted.toString(CryptoJS.enc.Utf8);

   console.log("Decrypted data: " + decrypted);

   return decrypted;
}

function generateRandomKey() {
  var salt = CryptoJS.lib.WordArray.random(128 / 8);
  return salt.toString(CryptoJS.enc.Base64)
}


function generateRSAkeys(keySize) {
  var crypt = new JSEncrypt({default_key_size: keySize});
  crypt.getKey();

  var keys = {
    privateKey: crypt.getPrivateKey(),
    publicKey: crypt.getPublicKey()
  };

  return keys;
}

function asymEncrypt(data, publicKey){

  var encrypt = new JSEncrypt();
  encrypt.setKey(publicKey);

  console.log("Content: " + data);
  var encoded = encrypt.encrypt(data);

  console.log("Encoded: " + encoded);

  return encoded;
}

function asymDecrypt(encryptedData, privateKey){

  var decrypt = new JSEncrypt();
  decrypt.setPrivateKey(privateKey);

  console.log("Encoded: " + encryptedData);
  var uncrypted = decrypt.decrypt(encryptedData);

  console.log("Decoded: " + uncrypted);

  return uncrypted;
}



