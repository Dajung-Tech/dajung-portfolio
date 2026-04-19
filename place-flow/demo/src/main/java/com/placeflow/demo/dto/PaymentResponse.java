package com.placeflow.demo.dto;

public class PaymentResponse {
    private Long paymentId;
    private Long orderId;
    private String paymentKey;
    private int amount;
    private String status;

    public PaymentResponse(Long paymentId, Long orderId, String paymentKey, int amount, String status) {
        this.paymentId = paymentId;
        this.orderId = orderId;
        this.paymentKey = paymentKey;
        this.amount = amount;
        this.status = status;
    }

    public Long getPaymentId() {
        return paymentId;
    }

    public Long getOrderId() {
        return orderId;
    }

    public String getPaymentKey(){
        return paymentKey;
    }

    public int getAmount() {
        return amount;
    }

    public String getStatus() {
        return status;
    }
}
