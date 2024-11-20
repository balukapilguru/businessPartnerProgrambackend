const crypto = require('crypto');
const algorithm = 'aes-256-cbc'; 

function encrypt(text) {
   const key = Buffer.from('1234567890abcdef1234567890abcdef', 'utf-8');
   const iv = Buffer.from('abcdef1234567890', 'utf-8');
   const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
   let encrypted = cipher.update(text);
   encrypted = Buffer.concat([encrypted, cipher.final()]);

   return { 
      //  iv: iv.toString('hex'), 
       encryptedData: encrypted.toString('hex'),
      //  key: key.toString('hex') 
   };
}


 function decrypt(text) {
   const key = Buffer.from('1234567890abcdef1234567890abcdef', 'utf-8');
   const iv = Buffer.from('abcdef1234567890', 'utf-8');
    let encryptedText = Buffer.from(text.encryptedData, 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc',key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
 }

 module.exports ={
    encrypt,
    decrypt
 }