package com.playmate.demo.health;

import com.playmate.demo.common.dto.HealthResponse;
import com.playmate.demo.common.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    @GetMapping("/api/health")
    public ApiResponse<HealthResponse> health() {
        return ApiResponse.success(
            new HealthResponse("UP", "playmate-backend")
        );
    }
}
