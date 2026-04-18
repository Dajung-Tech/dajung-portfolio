package com.placeflow.demo.service;

import java.time.Duration;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class IdempotencyService {
    private final StringRedisTemplate redisTemplate;
    
    public IdempotencyService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public boolean tryAcquire(String requestId) {
        String key = "placeflow:idempotency:" + requestId;
        Boolean success = redisTemplate.opsForValue().setIfAbsent(key, "processing", Duration.ofMinutes(5));
        return Boolean.TRUE.equals(success);
    }
}
