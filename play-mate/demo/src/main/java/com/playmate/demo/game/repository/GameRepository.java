package com.playmate.demo.game.repository;

import com.playmate.demo.game.domain.Game;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameRepository extends JpaRepository<Game, Long> {
    Optional<Game> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
