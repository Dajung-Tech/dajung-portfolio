package com.playmate.demo.game.controller;

import com.playmate.demo.common.response.ApiResponse;
import com.playmate.demo.game.dto.GameResponse;
import com.playmate.demo.game.repository.GameRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Game", description = "게임 정보 API")
@RestController
public class GameController {
    private final GameRepository gameRepository;

    public GameController(GameRepository gameRepository){
        this.gameRepository = gameRepository;
    }

    @Operation(summary = "게임 목록 조회", description = "서비스에서 지원하는 게임 목록을 조회합니다.")
    @GetMapping("/api/games")
    public ApiResponse<List<GameResponse>> getGames() {
        List<GameResponse> result = gameRepository.findAll().stream()
            .map(game -> new GameResponse(
                    game.getId(), 
                    game.getName(), 
                    game.getSlug()
        ))
        .toList();

        return ApiResponse.success(result);
    }
    
}
