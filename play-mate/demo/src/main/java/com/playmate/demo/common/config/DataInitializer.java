package com.playmate.demo.common.config;

import com.playmate.demo.game.domain.Game;
import com.playmate.demo.game.repository.GameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    private final GameRepository gameRepository;

    @Override
    public void run(String... args) {
        createGameIfNotExists("Battle Ground", "battleground");
        createGameIfNotExists("Overwatch 2", "overwatch2");
        createGameIfNotExists("League of Legends", "lol");
        createGameIfNotExists("Valorant", "valorant");
        createGameIfNotExists("Maple Story", "maplestory");
    }

    private void createGameIfNotExists(String name, String slug) {
        if(!gameRepository.existsBySlug(slug)) {
            gameRepository.save(new Game(name, slug));
        }
    }
}
