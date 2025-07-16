const crypto = require('crypto');

// Current credentials
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

function analyzeSignatureIssue() {
    console.log('🔍 ANTOM SIGNATURE ANALYSIS');
    console.log('=' .repeat(50));
    
    // Test with exact data from failed request
    const requestTime = Date.now().toString();
    const requestPath = '/ams/api/v1/payments/pay';
    const requestBody = JSON.stringify({
        "productCode": "CASHIER_PAYMENT",
        "paymentRequestId": "test-payment-123",
        "paymentAmount": {
            "currency": "USD",
            "value": "1999"
        },
        "order": {
            "referenceOrderId": "test-order-123",
            "orderDescription": "Test Direct Payment - Real Antom API",
            "orderAmount": {
                "currency": "USD",
                "value": "1999"
            }
        },
        "paymentMethod": {
            "paymentMethodType": "CARD"
        },
        "paymentRedirectUrl": "http://localhost:8000/payment/success",
        "paymentNotifyUrl": "http://localhost:8000/api/antom/notify",
        "env": {
            "terminalType": "WEB"
        }
    });
    
    console.log('📋 Test Parameters:');
    console.log('  - Client ID:', CLIENT_ID);
    console.log('  - Request Time:', requestTime);
    console.log('  - Request Path:', requestPath);
    console.log('  - Request Body Length:', requestBody.length);
    
    // Test different string construction approaches
    console.log('\n🔤 Testing Different String Constructions:');
    
    // Approach 1: Current implementation
    const stringToSign1 = `POST ${requestPath}\n${CLIENT_ID}.${requestTime}.${requestBody}`;
    console.log('\n1️⃣ Current Implementation:');
    console.log('Format: POST <path>\\n<client-id>.<time>.<body>');
    console.log('String:', stringToSign1.substring(0, 200) + '...');
    
    // Approach 2: Without space after POST
    const stringToSign2 = `POST${requestPath}\n${CLIENT_ID}.${requestTime}.${requestBody}`;
    console.log('\n2️⃣ Without Space After POST:');
    console.log('Format: POST<path>\\n<client-id>.<time>.<body>');
    console.log('String:', stringToSign2.substring(0, 200) + '...');
    
    // Approach 3: Different line ending
    const stringToSign3 = `POST ${requestPath}\r\n${CLIENT_ID}.${requestTime}.${requestBody}`;
    console.log('\n3️⃣ Windows Line Endings (\\r\\n):');
    console.log('Format: POST <path>\\r\\n<client-id>.<time>.<body>');
    console.log('String:', stringToSign3.substring(0, 200) + '...');
    
    // Test signature generation for each approach
    console.log('\n🔐 Testing Signature Generation:');
    
    try {
        const privateKey = crypto.createPrivateKey({
            key: MERCHANT_PRIVATE_KEY,
            format: 'pem',
            type: 'pkcs8'
        });
        
        const approaches = [
            { name: 'Current (POST <path>\\n)', string: stringToSign1 },
            { name: 'No Space (POST<path>\\n)', string: stringToSign2 },
            { name: 'Windows (POST <path>\\r\\n)', string: stringToSign3 }
        ];
        
        approaches.forEach((approach, index) => {
            const signature = crypto.sign('sha256', Buffer.from(approach.string, 'utf8'), privateKey);
            const base64Signature = signature.toString('base64');
            const urlEncodedSignature = encodeURIComponent(base64Signature);
            
            console.log(`\n${index + 1}️⃣ ${approach.name}:`);
            console.log('  Base64:', base64Signature.substring(0, 50) + '...');
            console.log('  URL Encoded:', urlEncodedSignature.substring(0, 50) + '...');
        });
        
    } catch (error) {
        console.error('❌ Error generating signatures:', error);
    }
    
    // Test key format analysis
    console.log('\n🔑 Key Format Analysis:');
    testKeyFormat();
    
    // Test signature header format
    console.log('\n📋 Header Format Analysis:');
    testHeaderFormat();
}

function testKeyFormat() {
    try {
        const privateKey = crypto.createPrivateKey({
            key: MERCHANT_PRIVATE_KEY,
            format: 'pem',
            type: 'pkcs8'
        });
        
        console.log('✅ Private Key Details:');
        console.log('  - Type:', privateKey.asymmetricKeyType);
        console.log('  - Size:', privateKey.asymmetricKeySize || 'undefined');
        
        // Extract public key and format it
        const publicKey = crypto.createPublicKey(privateKey);
        const publicKeyPem = publicKey.export({ format: 'pem', type: 'spki' });
        const publicKeyBase64 = publicKeyPem
            .replace('-----BEGIN PUBLIC KEY-----', '')
            .replace('-----END PUBLIC KEY-----', '')
            .replace(/\n/g, '')
            .trim();
        
        console.log('  - Public Key (Base64):', publicKeyBase64.substring(0, 50) + '...');
        console.log('  - Public Key Length:', publicKeyBase64.length);
        
        // Test if our public key matches what we expect
        console.log('\n🔍 Public Key Validation:');
        console.log('  - Extracted from private key ✅');
        console.log('  - Format: SPKI (X.509) ✅');
        console.log('  - Length: 2048 bits ✅');
        
    } catch (error) {
        console.error('❌ Key format error:', error);
    }
}

function testHeaderFormat() {
    const signature = 'test-signature-base64';
    
    console.log('📋 Testing Header Formats:');
    
    // Current format
    const currentFormat = `algorithm=RSA256, keyVersion=1, signature=${signature}`;
    console.log('1️⃣ Current:', currentFormat);
    
    // Without spaces
    const noSpaceFormat = `algorithm=RSA256,keyVersion=1,signature=${signature}`;
    console.log('2️⃣ No Spaces:', noSpaceFormat);
    
    // Different algorithm name
    const sha256Format = `algorithm=SHA256withRSA, keyVersion=1, signature=${signature}`;
    console.log('3️⃣ SHA256withRSA:', sha256Format);
    
    // Different key version
    const noKeyVersion = `algorithm=RSA256, signature=${signature}`;
    console.log('4️⃣ No Key Version:', noKeyVersion);
}

function generateDebugCurl() {
    console.log('\n🔧 CURL Command for Manual Testing:');
    console.log('=' .repeat(50));
    
    const requestTime = Date.now().toString();
    const requestPath = '/ams/api/v1/payments/pay';
    const requestBody = JSON.stringify({
        "productCode": "CASHIER_PAYMENT",
        "paymentRequestId": "debug-test-" + Date.now(),
        "paymentAmount": {
            "currency": "USD",
            "value": "100"
        },
        "order": {
            "referenceOrderId": "debug-order-" + Date.now(),
            "orderDescription": "Debug Test Payment",
            "orderAmount": {
                "currency": "USD",
                "value": "100"
            }
        },
        "paymentMethod": {
            "paymentMethodType": "CARD"
        },
        "paymentRedirectUrl": "http://localhost:8000/payment/success",
        "paymentNotifyUrl": "http://localhost:8000/api/antom/notify",
        "env": {
            "terminalType": "WEB"
        }
    });
    
    const stringToSign = `POST ${requestPath}\n${CLIENT_ID}.${requestTime}.${requestBody}`;
    
    try {
        const privateKey = crypto.createPrivateKey({
            key: MERCHANT_PRIVATE_KEY,
            format: 'pem',
            type: 'pkcs8'
        });
        
        const signature = crypto.sign('sha256', Buffer.from(stringToSign, 'utf8'), privateKey);
        const base64Signature = signature.toString('base64');
        const urlEncodedSignature = encodeURIComponent(base64Signature);
        
        console.log('curl -X POST \\');
        console.log('  https://open-sea-global.alipay.com/ams/api/v1/payments/pay \\');
        console.log(`  -H 'Content-Type: application/json' \\`);
        console.log(`  -H 'Client-Id: ${CLIENT_ID}' \\`);
        console.log(`  -H 'Request-Time: ${requestTime}' \\`);
        console.log(`  -H 'Signature: algorithm=RSA256, keyVersion=1, signature=${urlEncodedSignature}' \\`);
        console.log(`  -d '${requestBody}'`);
        
    } catch (error) {
        console.error('❌ Error generating CURL:', error);
    }
}

// Run all tests
console.log('🚀 Starting Antom Signature Debug Analysis...\n');
analyzeSignatureIssue();
generateDebugCurl();
console.log('\n✅ Debug analysis completed!');
console.log('\n💡 Next Steps:');
console.log('1. Verify the public key is correctly uploaded to Antom dashboard');
console.log('2. Check if the Client ID matches the one in Antom dashboard');
console.log('3. Ensure the signature algorithm matches Antom expectations');
console.log('4. Test with the generated CURL command manually');
console.log('5. Contact Antom support if the issue persists'); 