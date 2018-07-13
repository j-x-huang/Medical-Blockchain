function loaded() {
    var buf = crypto.randomBytes(1024 / 8) // 128 bytes
    buf = new Uint32Array(new Uint8Array(buf).buffer)

    sjcl.random.addEntropy(buf, 1024, "crypto.randomBytes")

    sjcl.random.startCollectors();
  }


  function getRandomSalt(words, paranoia) {
    return sjcl.random.randomWords(words, paranoia);
  }


  function stretchPassword(password){

     var salt = getRandomSalt(4,10);

     var iterations = 10000;

     var keyLength = 256;

     if (password.length == 0) {
        error("Need a password!");
        return;
     }

     var keyBitArray = sjcl.misc.pbkdf2(password, salt, iterations, keyLength);

     var key = sjcl.codec.hex.fromBits(keyBitArray);

     return key;
  }

  function symEncrypt(data, key){

     if (data === '') { return; }
     if (key.length == 0) {
       error("Need a key!");
       return;
     }

     // Key must be in bit array
     var encryptedData = sjcl.encrypt(key, data, {mode : "ccm || gcm || ocb2"});

     // var encryptedDataBase64 = sjcl.codec.base64.fromBits(encryptedDataBitArray);

     return encryptedData;
  }


  function symDecrypt(encryptedData, key){

     if (encryptedData.length === 0) { return; }
     if (key.length == 0) {
       error("Need a key!");
       return;
     }

     // var encryptedDataBitArray = sjcl.codec.base64.toBits(encryptedDataBase64);

     var data = sjcl.decrypt(key, encryptedData);

     // var plainData = sjcl.codec.utf8String.fromBits(dataBits);

     return data;
  }