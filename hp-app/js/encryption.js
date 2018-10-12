
const_publicKey = '';

const_privateKey = '';

function loaded() {

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

   var encrypted = CryptoJS.AES.encrypt(data, key);

   console.log(encrypted);

   return encrypted;
}


function symDecrypt(encryptedData, key){

   console.log(encryptedData);

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

  console.log(keySize)
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



