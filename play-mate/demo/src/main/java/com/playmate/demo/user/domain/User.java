package com.playmate.demo.user.domain;

import com.playmate.demo.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
    name="users",
    uniqueConstraints = {
        @uniqueConstraint(name = "uk_user_email", columnNames = "email"),
        @UniqueConstraint(name = "uk_user_nickname", columnNames = "nickname")
    }
)

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 100)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(nullable = false, length = 30)
    private String nickname;

    @Column(length = 300)
    private String bio;

    public User(String email, String password, String nickname, String bio) {
        this.emain = email;
        this.password = password;
        this.nickname = nickname;
        this.bio = bio;
    }
}
