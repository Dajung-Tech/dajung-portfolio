package com.placeflow.demo.dto;

public class CreateOrderRequest {
    private String requestId;
    private Long merchantId;
    private int totalAmount;

    public String getRequestId() {
        return requestId;
    }

    public Long getMerchantId() {
        return merchantId;
    }

    public int getTotalAmount() {
        return totalAmount;
    }
}
