package com.placeflow.demo.dto;

public class CreateOrderRequest {
    private Long merchantId;
    private int totalAmount;

    public Long getMerchantId() {
        return merchantId;
    }

    public int getTotalAmount() {
        return totalAmount;
    }
}
