package com.placeflow.demo.exception;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(DuplicateRequestException.class)
    public Map<String, Object> handleDuplicateRequest(DuplicateRequestException e) {
        return Map.of("status", HttpStatus.CONFLICT.value(), "message", e.getMessage());
    }
}
