package com.playmate.demo.health;

import com.playmate.demo.common.dto.HealthResponse;
import com.playmate.demo.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Health", description = "서버 상태 확인 API")
@RestController
public class HealthController {

    @Operation(summary = "헬스 체크", description = "백엔드 서버 상태를 확인합니다.")
    @GetMapping("/api/health")
    public ApiResponse<HealthResponse> health() {
        return ApiResponse.success(
            new HealthResponse("UP", "playmate-backend")
        );
    }
}
