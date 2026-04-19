package com.placeflow.demo.service;

import com.placeflow.demo.domain.CustomerOrder;
import com.placeflow.demo.dto.CreateOrderRequest;
import com.placeflow.demo.dto.OrderResponse;
import com.placeflow.demo.repository.CustomerOrderRepository;
import com.placeflow.demo.exception.DuplicateRequestException;

import org.springframework.stereotype.Service;

@Service
public class OrderService {
    private final CustomerOrderRepository repository;
    private final IdempotencyService idempotencyService;

    public OrderService(CustomerOrderRepository repository, IdempotencyService idempotencyService) {
        this.repository = repository;
        this.idempotencyService = idempotencyService;
    }

    public OrderResponse create(CreateOrderRequest request) {
        boolean acquired = idempotencyService.tryAcquire(request.getRequestId());
        if(!acquired) {
            throw new DuplicateRequestException("중복 요청입니다.");
        }
        
        CustomerOrder order = new CustomerOrder();
        order.setMerchantId(request.getMerchantId());
        order.setStatus("CREATED");
        order.setTotalAmount(request.getTotalAmount());

        CustomerOrder saved = repository.save(order);

        return new OrderResponse(saved.getId(), saved.getMerchantId(), saved.getStatus(), saved.getTotalAmount());
    }

    public OrderResponse get(Long id) {
        CustomerOrder order = repository.findById(id).orElseThrow();

        return new OrderResponse(order.getId(), order.getMerchantId(), order.getStatus(), order.getTotalAmount());
    }
}
