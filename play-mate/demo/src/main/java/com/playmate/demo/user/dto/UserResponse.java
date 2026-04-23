package com.playmate.demo.user.dto;

import com.playmte.demo.user.domain.User;
import java.time.LocalDateTime;

public record UserResponse (
    Long id,
    String email,
    String nickname,
    String bio,
    LocalDateTime createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(), 
            user.getEmail(), 
            user.getNickName(), 
            user.getBio(), 
            user.getCreateAt()
        );
    }
}
