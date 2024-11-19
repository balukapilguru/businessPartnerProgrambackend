const crypto = require('crypto');
const algorithm = 'aes-256-cbc'; 

function encrypt(text) {
   const crypto = require('crypto');
   const key = crypto.randomBytes(32); 
   const iv = crypto.randomBytes(16); 
   const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
   let encrypted = cipher.update(text);
   encrypted = Buffer.concat([encrypted, cipher.final()]);

   return { 
       iv: iv.toString('hex'), 
       encryptedData: encrypted.toString('hex'),
       key: key.toString('hex') 
   };
}


 function decrypt(text) {
    let iv = Buffer.from(text.iv, 'hex');
    let encryptedText = Buffer.from(text.encryptedData, 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(text.key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
 }

 module.exports ={
    encrypt,
    decrypt
 }