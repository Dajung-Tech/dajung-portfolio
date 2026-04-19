package com.placeflow.demo.controller;

import com.placeflow.demo.domain.Payment;
import com.placeflow.demo.dto.ApprovePaymentRequest;
import com.placeflow.demo.dto.PaymentResponse;
import com.placeflow.demo.service.PaymentService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments")
public class PaymentController {
    private final PaymentService paymentService;
    
    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/approve")
    public PaymentResponse approve(@RequestBody ApprovePaymentRequest request) {
        return paymentService.approve(request);
    }
}
