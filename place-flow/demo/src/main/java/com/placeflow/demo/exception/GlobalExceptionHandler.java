package com.placeflow.demo.exception;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(DuplicateRequestException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateRequest(DuplicateRequestException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(Map.of("status", HttpStatus.CONFLICT.value(), "message", e.getMessage()
        ));
    }

    @ExceptionHandler(OrderNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleOrderNotFound(OrderNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(Map.of("status", HttpStatus.NOT_FOUND.value(), "message", e.getMessage()
        ));
    }

    @ExceptionHandler(DuplicatePaymentException.class)
    public ResponseEntity<Map<String, Object>> handlerDuplicatePayment(DuplicatePaymentException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(Map.of("status", HttpStatus.CONFLICT.value(), "message", e.getMessage()
        ));
    }
}
