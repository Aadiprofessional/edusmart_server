package com.antom.checkout.api;

import com.alibaba.fastjson.JSON;
import com.alipay.global.api.AlipayClient;
import com.alipay.global.api.DefaultAlipayClient;
import com.alipay.global.api.exception.AlipayApiException;
import com.alipay.global.api.model.Result;
import com.alipay.global.api.model.ResultStatusType;
import com.alipay.global.api.model.ams.*;
import com.alipay.global.api.model.constants.EndPointConstants;
import com.alipay.global.api.request.ams.notify.AlipayPayResultNotify;
import com.alipay.global.api.request.ams.pay.AlipayPayQueryRequest;
import com.alipay.global.api.request.ams.pay.AlipayPayRequest;
import com.alipay.global.api.response.ams.pay.AlipayPayQueryResponse;
import com.alipay.global.api.response.ams.pay.AlipayPayResponse;
import com.alipay.global.api.tools.WebhookTool;
import lombok.Data;
import org.joda.money.CurrencyUnit;
import org.joda.money.Money;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

/**
 * sample payment server using Antom API integration mode
 **/
@Controller
@RequestMapping("/payment")
@CrossOrigin
@SpringBootApplication
public class PaymentServer {
    /**
     * replace with your client id <br>
     * find your client id here: <a href="https://dashboard.antom.com/global-payments/developers/quickStart">quickStart</a>
     */
    public static final String CLIENT_ID = "your_client_id";

    /**
     * replace with your antom public key (used to verify signature) <br>
     * find your antom public key here: <a href="https://dashboard.antom.com/global-payments/developers/quickStart">quickStart</a>
     */
    public static final String ANTOM_PUBLIC_KEY = "antom_public_key";

    /**
     * replace with your private key (used to sign) <br>
     * please ensure the secure storage of your private key to prevent leakage
     */
    public static final String MERCHANT_PRIVATE_KEY = "your_private_key";

    private final static AlipayClient CLIENT = new DefaultAlipayClient(
            EndPointConstants.SG, MERCHANT_PRIVATE_KEY, ANTOM_PUBLIC_KEY, CLIENT_ID);
    public static void main(String[] args) {
        SpringApplication.run(PaymentServer.class, args);
        System.out.println("Open your browser and visit: http://localhost:8080");
    }
    @PostMapping("/pay")
    public ResponseEntity<ApiResponse> pay(@RequestBody PaymentVO payment) {
        AlipayPayRequest alipayPayRequest = new AlipayPayRequest();
        alipayPayRequest.setProductCode(ProductCodeType.CASHIER_PAYMENT);

        // convert amount unit(in practice, amount should be calculated on your serverside)
        // For details, please refer to: <a href="https://docs.antom.com/ac/ref/cc">Usage rules of the Amount object</a>
        long amountMinorLong = Money.of(CurrencyUnit.of(payment.currency), new BigDecimal(payment.amountValue)).getAmountMinorLong();

        // set amount
        Amount amount = Amount.builder().currency(payment.currency).value(String.valueOf(amountMinorLong)).build();
        alipayPayRequest.setPaymentAmount(amount);

        // replace with your paymentRequestId
        String paymentRequestId = UUID.randomUUID().toString();
        alipayPayRequest.setPaymentRequestId(paymentRequestId);

        // set paymentMethod
        PaymentMethod paymentMethod = PaymentMethod.builder().paymentMethodType(payment.paymentMethodType).build();
        alipayPayRequest.setPaymentMethod(paymentMethod);

        // replace with your orderId
        String orderId = UUID.randomUUID().toString();

        // when paymentMethodType is CARD, need to set authorization
        if ("CARD".equals(payment.paymentMethodType)) {
            PaymentFactor paymentFactor = PaymentFactor.builder().isAuthorization(true).build();
            alipayPayRequest.setPaymentFactor(paymentFactor);
        }

        // set buyer info
        Buyer buyer = Buyer.builder().referenceBuyerId("yourBuyerId").build();

        // set order info
        Order order = Order.builder().referenceOrderId(orderId)
                .orderDescription("antom api testing order").orderAmount(amount).buyer(buyer).build();
        alipayPayRequest.setOrder(order);

        // set env info
        Env env = Env.builder().terminalType(TerminalType.valueOf(payment.terminalType)).clientIp("1.2.3.4").build();
        if (!TerminalType.WEB.equals(TerminalType.valueOf(payment.terminalType)) && payment.osType != null) {
            env.setOsType(OsType.valueOf(payment.osType));
        }
        alipayPayRequest.setEnv(env);

        // replace with your notify url
        // or configure your notify url here: <a href="https://dashboard.antom.com/global-payments/developers/iNotify">Notification URL</a>
        alipayPayRequest.setPaymentNotifyUrl("http://www.yourNotifyUrl.com/payment/receivePaymentNotify");
        // replace with your redirect url
        alipayPayRequest.setPaymentRedirectUrl(
                "http://localhost:8080/index.html?paymentRequestId=" + paymentRequestId);
        AlipayPayResponse alipayPayResponse;
        try {
            long startTime = System.currentTimeMillis();
            System.out.println("payment request: " + JSON.toJSONString(alipayPayRequest));
            alipayPayResponse = CLIENT.execute(alipayPayRequest);
            System.out.println("payment response: " + JSON.toJSONString(alipayPayResponse));
            System.out.println("payment request cost time: " + (System.currentTimeMillis() - startTime) + "ms\n");
        } catch (AlipayApiException e) {
            return ResponseEntity.ok().body(new ApiResponse(paymentRequestId, e));
        }

        return ResponseEntity.ok().body(new ApiResponse(paymentRequestId, alipayPayResponse));
    }
    @RequestMapping(path = "/inquiryPayment", method = RequestMethod.POST)
    public ResponseEntity<ApiResponse> inquiryPayment(@RequestBody Map<String, String> map) {
        String paymentRequestId = map.get("paymentRequestId");
        AlipayPayQueryRequest alipayPayQueryRequest = new AlipayPayQueryRequest();
        alipayPayQueryRequest.setPaymentRequestId(paymentRequestId);

        AlipayPayQueryResponse alipayPayQueryResponse;
        try {
            long startTime = System.currentTimeMillis();
            System.out.println("inquiry payment request: " + JSON.toJSONString(alipayPayQueryRequest));
            alipayPayQueryResponse = CLIENT.execute(alipayPayQueryRequest);
            System.out.println("inquiry payment response: " + JSON.toJSONString(alipayPayQueryResponse));
            System.out.println("inquiry payment request cost time: " + (System.currentTimeMillis() - startTime) + "ms\n");
        } catch (AlipayApiException e) {
            return ResponseEntity.ok().body(new ApiResponse(paymentRequestId, e));
        }
        return ResponseEntity.ok().body(new ApiResponse(paymentRequestId, alipayPayQueryResponse));
    }
    /**
     * receive payment notify
     *
     * @param request    request
     * @param notifyBody notify body
     * @return Result
     */
    @PostMapping("/receivePaymentNotify")
    @ResponseBody
    public Result receivePaymentNotify(HttpServletRequest request, @RequestBody String notifyBody) {
        // retrieve the required parameters from http request
        String requestUri = request.getRequestURI();
        String requestMethod = request.getMethod();

        // retrieve the required parameters from request header
        String requestTime = request.getHeader("request-time");
        String clientId = request.getHeader("client-id");
        String signature = request.getHeader("signature");

        try {
            // verify the signature of notification
            boolean verifyResult = WebhookTool.checkSignature(requestUri, requestMethod, clientId,
                    requestTime, signature, notifyBody, ANTOM_PUBLIC_KEY);
            if (!verifyResult) {
                throw new RuntimeException("Invalid notify signature");
            }

            // deserialize the notification body
            AlipayPayResultNotify paymentNotify = JSON.parseObject(notifyBody, AlipayPayResultNotify.class);

            if (paymentNotify != null && "SUCCESS".equals(paymentNotify.getResult().getResultCode())) {
                // handle your own business logic.
                // e.g. The relationship between payment information and users is kept in the database.
                System.out.println("receive payment notify: " + JSON.toJSONString(paymentNotify));
                return Result.builder().resultCode("SUCCESS").resultMessage("success.").resultStatus(ResultStatusType.S).build();
            }

        } catch (Exception e) {
            return Result.builder().resultCode("FAIL").resultMessage("fail.").resultStatus(ResultStatusType.F).build();
        }

        return Result.builder().resultCode("SYSTEM_ERROR").resultMessage("system error.").resultStatus(ResultStatusType.F).build();
    }
    @Data
    public static class PaymentVO {
        private String amountValue;
        private String currency;
        private String paymentMethodType;
        private String terminalType = "WEB";
        private String osType;
    }

    @Data
    private static class ApiResponse {
        private String status = "success";
        private String paymentRequestId = "";
        private String message;
        private Object data;

        public ApiResponse(String paymentRequestId, Object data) {
            this.paymentRequestId = paymentRequestId;
            this.data = data;
        }

        public ApiResponse(String paymentRequestId, AlipayApiException e) {
            this.paymentRequestId = paymentRequestId;
            this.status = "error";
            this.message = e.getMessage();
        }
    }

}
