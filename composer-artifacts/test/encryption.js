var sjcl = require("sjcl");
var CryptoJS = require("crypto-js");
var JSEncrypt = require("node-jsencrypt");

module.exports = {
  loaded: loaded,

  getRandomSalt: getRandomSalt,

  kdf: kdf,

  symEncrypt: symEncrypt,

  symDecrypt: symDecrypt,

  generateRandomKey: generateRandomKey,

  generateRSAkeys: generateRSAkeys,

  asymEncrypt: asymEncrypt,

  asymDecrypt: asymDecrypt
};

const const_publicKey = "";

const const_privateKey = "";

function loaded() {
  //var buf = crypto.randomBytes(1024 / 8) // 128 bytes
  //buf = new Uint32Array(new Uint8Array(buf).buffer)

  //sjcl.random.addEntropy(buf, 1024, "crypto.randomBytes")

  sjcl.random.startCollectors();
}

function getRandomSalt(words, paranoia) {
  var salt = sjcl.random.randomWords(words, paranoia);
  salt = sjcl.codec.base64.fromBits(salt);
  return salt;
}

function kdf(password, salt) {
  var iterations = 10000;
  var keyLength = 256;
  if (password.length === 0) {
    error("Need a password!");
    return;
  }
  var keyBitArray = sjcl.misc.pbkdf2(password, salt, iterations, keyLength);
  var key = sjcl.codec.hex.fromBits(keyBitArray);
  return key;
}

function symEncrypt(data, key) {
  var encrypted = CryptoJS.AES.encrypt(data, key);
  return String(encrypted);
}

function symDecrypt(encryptedData, key) {
  var decrypted = CryptoJS.AES.decrypt(encryptedData, key);
  decrypted = decrypted.toString(CryptoJS.enc.Utf8);
  return decrypted;
}

function generateRandomKey() {
  var salt = CryptoJS.lib.WordArray.random(128 / 8);
  return salt.toString(CryptoJS.enc.Base64);
}

function generateRSAkeys(keySize) {
  var crypt = new JSEncrypt({ default_key_size: keySize });
  crypt.getKey();
  var keys = {
    privateKey: crypt.getPrivateKey(),
    publicKey: crypt.getPublicKey()
  };
  return keys;
}

function asymEncrypt(data, publicKey) {
  var encrypt = new JSEncrypt();
  encrypt.setKey(publicKey);
  var encoded = encrypt.encrypt(data);
  return encoded;
}

function asymDecrypt(encryptedData, privateKey) {
  var decrypt = new JSEncrypt();
  decrypt.setPrivateKey(privateKey);
  var uncrypted = decrypt.decrypt(encryptedData);
  return uncrypted;
}
