package com.playmate.demo.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;

import javax.naming.ldap.ControlFactory;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Play Mate API")
                        .description("게임 친구를 찾아주는 서비스 API 문서")
                        .version("v0.1")
                        .contact(new Contact()
                                    .name("dajung")
                                    .email("dajung2237@gmail.com")));
    }
}
