package com.playmate.demo.game.controller;

import com.playmate.demo.common.response.ApiResponse;
import com.playmate.demo.game.dto.GameResponse;
import com.playmate.demo.game.repository.GameRepository;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GameController {
    private final GameRepository gameRepository;

    public GameController(GameRepository gameRepository){
        this.gameRepository = gameRepository;
    }

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
