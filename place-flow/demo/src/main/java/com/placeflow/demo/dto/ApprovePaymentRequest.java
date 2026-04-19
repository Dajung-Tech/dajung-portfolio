package com.placeflow.demo.dto;

public class ApprovePaymentRequest {
    private String requestId;
    private Long orderId;
    private String paymentKey;
    private int amount;

    public String getRequestId(){
        return requestId;
    }

    public Long getOrderId() {
        return orderId;
    }

    public String getPaymentKey() {
        return paymentKey;
    }

    public int getAmount() {
        return amount;
    }
}
