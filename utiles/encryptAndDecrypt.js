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
 function getFormattedISTDateTime() {
   const now = new Date();
   const utcOffset = now.getTimezoneOffset();
   const istOffset = 330; 
   
 
   const istDate = new Date(now.getTime() + (istOffset + utcOffset) * 60000);
   
   
   const formattedDate = `${String(istDate.getMonth() + 1).padStart(2, '0')}-${String(istDate.getDate()).padStart(2, '0')}-${istDate.getFullYear()}`;
   
   const formattedTime = `${String(istDate.getHours()).padStart(2, '0')}:${String(istDate.getMinutes()).padStart(2, '0')}`;
   
   return { date: formattedDate, time: formattedTime };
}
 module.exports ={
    encrypt,
    decrypt,
    getFormattedISTDateTime
 }