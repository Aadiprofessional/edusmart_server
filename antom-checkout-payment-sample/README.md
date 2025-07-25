# antom-online-payments-demo

## Getting Started

This is a demo project to show how Antom payment works. For more detailed information, please visit [Antom Docs](https://docs.antom.com/)

## Requirements

-   Java 1.8 or later

## Config
**<font color="#5A5AAD">Please make sure to replace the following parameters with your own to ensure correct integration.</font>**

Replace the following parameters in [PaymentServer.java]()-  `CLIENT_ID`: Client ID-  `ANTOM_PUBLIC_KEY`: Antom Public Key-  `MERCHANT_PRIVATE_KEY`: Your Private Key (Antom won't save your private key, so you can't see it on dashboard, please refer [API key configuration](https://docs.antom.com/ac/ref/key_config))
You can find `CLIENT_ID` and `ANTOM_PUBLIC_KEY` on [Antom Dashboard](https://dashboard.antom.com/global-payments/developers/quickStart)

Follow the information below to configure the callback address information in PaymentServer.java to ensure that the program works correctly.

| platforms      | product              | integration types | redirectUrl                                                                                                |
|----------------|----------------------|-------------------|------------------------------------------------------------------------------------------------------------|
| Web(React/Vue) | checkout payment     | API/SDK/CKP       | paymentRedirectUrl: "http://localhost:5173/index.html?paymentRequestId=" + paymentRequestId                |
|                | auto debit           | API               | authRedirectUrl: "http://localhost:5173/receiveAuthCode.html"                                              |
|                |                      | SDK               | authRedirectUrl: "http://localhost:5173/receiveAuthCode"                                                   |
|                | easysafepay          | SDK               | paymentRedirectUrl: "http://localhost:5173/index.html?paymentRequestId=" + paymentRequestId                |              
|                | subscription payment | API               | subscriptionRedirectUrl: "http://localhost:5173/index.html?subscriptionRequestId=" + subscriptionRequestId |
| Android/iOS    | checkout payment     | API               | paymentRedirectUrl: "cashierapi://app?paymentRequestId=" + paymentRequestId                                |
|                |                      | SDK               | paymentRedirectUrl: "cashiersdk://app?paymentRequestId=" + paymentRequestId                                |
|                | auto debit           | API               | authRedirectUrl: "autodebitapi://app/receiveAuthCode"                                                      |
|                |                      | SDK               | authRedirectUrl: "autodebitsdk://app/receiveAuthCode"                                                      |
|                | easysafepay          | SDK               | paymentRedirectUrl: "easysafepay://app?paymentRequestId=" + paymentRequestId                               |              
|                | subscription payment | API               | subscriptionRedirectUrl: "subscription://app?subscriptionRequestId=" + subscriptionRequestId               |

## Run
You can run this demo in two ways:

### Start Locally
Start application by running [PaymentServer.java]()

After start, visit demo page in browser：[http://localhost:8080](http://localhost:8080)

### Package & Run
1. package project
   ``` shell   mvn clean package   ```

2. run server
   ``` shell   java -jar ./target/antom-sample-code-0.0.1.jar   ```
