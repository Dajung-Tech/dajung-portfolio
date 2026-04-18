package com.placeflow.demo.service;

import com.placeflow.demo.domain.CustomerOrder;
import com.placeflow.demo.dto.CreateOrderRequest;
import com.placeflow.demo.dto.OrderResponse;
import com.placeflow.demo.repository.CustomerOrderRepository;
import org.springframework.stereotype.Service;

@Service
public class OrderService {
    private final CustomerOrderRepository repository;
    public OrderService(CustomerOrderRepository repository) {
        this.repository = repository;
    }

    public OrderResponse create(CreateOrderRequest request) {
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
