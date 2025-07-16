const crypto = require('crypto');

// Test keys (same as in service)
const CLIENT_ID = '5YEX0L302DFU04384';
const MERCHANT_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDJcOFssYnl01lO
x9OA2UMydycCPV5EkPtR5gXY4SqNfDvvBYZnjL9gOesq+b9536JaW0PIQHOxBtWH
vGbpQgmyINEHngzgbsOPA4d75kOmeyIk8kCMZ9z52jw2b87Vm7TXWi0ZsXtKGL77
hhZ012X3Y0Jtut/WAAPWYg/9DdvRCFD+mQcPrYXu6HJgCA1dKT2e6t3gZwKUiqh2
zMmIA+W/XqKoXUm1EX/wyW034bgiqLdsnNYBTIyk0l49yK3nkVF9smRR4dSkNRBf
aAwLor6g/sRE0j7bBBpDTV2L5S0Jak5hnWG82F8TJJcD9GTDMQb0IOj0ajia4Yh7
YCwRV/mzAgMBAAECggEAe6oBqcGgP2gtNnD0RfCbERsW5ogYHA3JS7DjvA4XGn6/
KHCC34UHY6KK3Xou8zm4KLJIfWIb4/ynD8o4f1BcNW9yA7QigZFeGqj2/rgQpd6H
ypixycBlZzlzp5OiLX6GWYJxl4lef9GLRUw+8wHdBi94c3a6vVyK/ox69kYQwVS6
9evOApFk1XWgsN5jo96FtERilZTdVdfuXy/eeGNaIdHKKz7XKol1FVTrEBeNd2Uo
IfU7VNBXAdy5s1RsUzYT/AyaFWc29muv0Uty12oqQXwXU7DQP89mIR7F+qNBRs2R
Q9aIfCjZiU/IvoCoS+CJ4KUx+up8uAyaCUD0gq7BsQKBgQD1/A2snNYC68jYc1WW
/O47wZ9mXt73c//2Wv8BofyvusHO91DpICvq28fr6L/mOXVKe5rQK1cO7tatK9S5
adZooS034lkdCVy5sHMdne71g3+w2zNSVL+8DAxBi8HtjXZVb4jinOLl2URri8N6
RblmCr+wg1LrPeOKhUCP0qxpOQKBgQDRpIoyGU5wWCK8u6nwbzh1XaQY24ajReweBfO0xRniBrM8vLFFJ6xMnAvkrdPom50Xap7RAQghFZaGFpC261kkUNzd4Pu5lgfS3NNSS7E+Flk+Ngkb5iB+gsOPyMW0/pkKDzEYjmeTXS56ZL5O3K1NLjuN5TFKbtGuFQC7hVxWSwKBgQDAuHO2M0JxE25ONz5th0jXRIGwYM/rq9R0nSKBkvo4a+eAUb/whiYiYYMmzznaFFZSvriyM+KHbpR/JIILqmIzo2OcDximaTleumHWaHBZpmcalwKElKWLnRzVFbwgc96sXTAv657RWgIDCINkftAcpHs+vgTvDZQCaRgGFpbB8QKBgB6l7GIomvQHnoRy9wQkbl+SIgRUS5mhBkTZX+iEjCUkD54Ig+31P9YvVfnHg9xUq6GZv8AUY4jarBfMQrnLLEwH2lJBqutVyK0GBYrZb/8Aq2lR4wEGIqf8G/TwSB8OvXbgA7BwWSoNDFduVPgYgOlwodo7sHoOO280uNexRm+DAoGBALmtenWQghbWzlTjM/qMLdgu+1NPhBw4FhBJbzKUFYLLx3gQE85h8gfun1mA58Z5MEzV8cmkQUShNUuk6EYBZHMbRaIeZ6cDt8JYtuGOuSrFArYfZhMETFA/1tCWbUxlymHdSJkEPk5gTcl1b0GL6lpyk2iojVxF18Y+5STPoYMu
-----END PRIVATE KEY-----`;

function testSignature() {
    console.log('🧪 Testing Antom Signature Generation');
    console.log('=====================================');
    
    try {
        // Create private key
        const privateKey = crypto.createPrivateKey({
            key: MERCHANT_PRIVATE_KEY,
            format: 'pem',
            type: 'pkcs8'
        });
        
        console.log('✅ Private key loaded successfully');
        console.log('📋 Key type:', privateKey.asymmetricKeyType);
        console.log('📋 Key size:', privateKey.asymmetricKeySize);
        
        // Test data
        const requestTime = '1736893577018';
        const requestPath = '/ams/api/v1/payments/pay';
        const requestBody = '{"productCode":"CASHIER_PAYMENT","paymentRequestId":"c90f46a1-6164-4967-8d64-36cee0c9da34","paymentAmount":{"currency":"USD","value":"1999"},"order":{"referenceOrderId":"3ed786f4-bf12-48bc-9abe-00652d6cd174","orderDescription":"Test Direct Payment - Real Antom API","orderAmount":{"currency":"USD","value":"1999"}},"paymentMethod":{"paymentMethodType":"CARD"},"paymentRedirectUrl":"http://localhost:8000/payment/success","paymentNotifyUrl":"http://localhost:8000/api/antom/notify","env":{"terminalType":"WEB"}}';
        
        // Construct string to sign
        const stringToSign = `POST ${requestPath}\n${CLIENT_ID}.${requestTime}.${requestBody}`;
        
        console.log('\n🔤 String to sign:');
        console.log(stringToSign);
        console.log('\n📏 String length:', stringToSign.length);
        
        // Generate signature
        const signature = crypto.sign('sha256', Buffer.from(stringToSign, 'utf8'), privateKey);
        const base64Signature = signature.toString('base64');
        const urlEncodedSignature = encodeURIComponent(base64Signature);
        
        console.log('\n📝 Raw signature (base64):', base64Signature);
        console.log('\n🔗 URL encoded signature:', urlEncodedSignature);
        
        // Test with different algorithms
        console.log('\n🔍 Testing different signature algorithms:');
        
        const algorithms = ['sha256', 'RSA-SHA256'];
        
        for (const alg of algorithms) {
            try {
                const sig = crypto.sign(alg, Buffer.from(stringToSign, 'utf8'), privateKey);
                console.log(`✅ ${alg}: ${sig.toString('base64').substring(0, 50)}...`);
            } catch (error) {
                console.log(`❌ ${alg}: ${error.message}`);
            }
        }
        
        // Test verification with public key
        console.log('\n🔐 Testing signature verification:');
        
        const publicKey = crypto.createPublicKey(privateKey);
        const isValid = crypto.verify('sha256', Buffer.from(stringToSign, 'utf8'), publicKey, signature);
        console.log('✅ Self-verification result:', isValid ? 'VALID' : 'INVALID');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Test key format validation
function testKeyFormat() {
    console.log('\n🔑 Testing Key Format');
    console.log('====================');
    
    try {
        const keyObject = crypto.createPrivateKey({
            key: MERCHANT_PRIVATE_KEY,
            format: 'pem',
            type: 'pkcs8'
        });
        
        console.log('✅ Key format is valid PKCS8');
        console.log('📋 Key details:');
        console.log('  - Type:', keyObject.asymmetricKeyType);
        console.log('  - Size:', keyObject.asymmetricKeySize, 'bytes');
        console.log('  - Format:', keyObject.asymmetricKeyType === 'rsa' ? 'RSA' : 'Unknown');
        
        // Export public key
        const publicKey = crypto.createPublicKey(keyObject);
        const publicKeyPem = publicKey.export({ format: 'pem', type: 'spki' });
        console.log('\n📤 Extracted public key:');
        console.log(publicKeyPem);
        
    } catch (error) {
        console.error('❌ Key format error:', error.message);
    }
}

// Run tests
testKeyFormat();
testSignature(); 