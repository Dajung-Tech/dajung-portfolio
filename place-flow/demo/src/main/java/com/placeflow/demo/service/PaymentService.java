package com.placeflow.demo.service;

import com.placeflow.demo.domain.CustomerOrder;
import com.placeflow.demo.domain.Payment;
import com.placeflow.demo.dto.ApprovePaymentRequest;
import com.placeflow.demo.dto.PaymentResponse;
import com.placeflow.demo.exception.DuplicatePaymentException;
import com.placeflow.demo.exception.DuplicateRequestException;
import com.placeflow.demo.exception.OrderNotFoundException;
import com.placeflow.demo.repository.CustomerOrderRepository;
import com.placeflow.demo.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final CustomerOrderRepository customerOrderRepository;
    private final IdempotencyService idempotencyService;
    
    public PaymentService(PaymentRepository paymentRepository, CustomerOrderRepository customerOrderRepository, IdempotencyService idempotencyService){
        this.paymentRepository = paymentRepository;
        this.customerOrderRepository = customerOrderRepository;
        this.idempotencyService = idempotencyService;
    }

    @Transactional
    public PaymentResponse approve(ApprovePaymentRequest request) {
        boolean acquired = idempotencyService.tryAcquire("payment:" + request.getRequestId());

        if(!acquired) {
            throw new DuplicateRequestException("중복 결제 승인 요청입니다.");
        }

        CustomerOrder order = customerOrderRepository.findById(request.getOrderId()).orElseThrow(()->new OrderNotFoundException("주문을 찾을 수 없습니다. orderId=" + request.getOrderId()));

        if(paymentRepository.existsByPaymentKey(request.getPaymentKey())) {
            throw new DuplicatePaymentException("이미 처리된 paymentKey 입니다.");
        }

        Payment payment = new Payment();
        payment.setOrderId(order.getId());
        payment.setPaymentKey(request.getPaymentKey());
        payment.setAmount(request.getAmount());
        payment.setStatus("APPROVED");

        Payment savedPayemnt = paymentRepository.save(payment);

        order.setStatus("PAID");

        return new PaymentResponse(savedPayemnt.getId(), savedPayemnt.getOrderId(), savedPayemnt.getPaymentKey(), savedPayemnt.getAmount(), savedPayemnt.getStatus());
    }
}
