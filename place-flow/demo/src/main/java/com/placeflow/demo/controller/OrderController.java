package com.placeflow.demo.controller;

import com.placeflow.demo.domain.CustomerOrder;
import com.placeflow.demo.dto.CreateOrderRequest;
import com.placeflow.demo.dto.OrderResponse;
import com.placeflow.demo.repository.CustomerOrderRepository;
import com.placeflow.demo.service.OrderService;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/orders")
public class OrderController {
    private final OrderService service;

    public OrderController(OrderService service) {
        this.service = service;
    }

    @PostMapping
    public OrderResponse create(@RequestBody CreateOrderRequest request) {
        return service.create(request);
    }

    @GetMapping("/{id}")
    public OrderResponse get(@PathVariable Long id) {
        return service.get(id);
    }
}
