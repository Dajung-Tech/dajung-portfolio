package com.placeflow.demo.dto;

public class OrderResponse {
    private Long id;
    private Long merchantId;
    private String status;
    private int totalAmount;

    public OrderResponse(Long id, Long merchantId, String status, int totalAmount) {
        this.id = id;
        this.merchantId = merchantId;
        this.status = status;
        this.totalAmount = totalAmount;
    }

    public Long getId() {
        return id;
    }

    public Long getMerchantId() {
        return merchantId;
    }

    public String getStatus() {
        return status;
    }

    public int getTotalAmount() {
        return totalAmount;
    }
}
