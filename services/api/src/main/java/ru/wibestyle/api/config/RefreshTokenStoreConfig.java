package ru.wibestyle.api.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import ru.wibestyle.api.auth.JdbcRefreshTokenStore;
import ru.wibestyle.api.auth.RefreshTokenStore;
import ru.wibestyle.api.auth.RedisRefreshTokenStore;

@Configuration
public class RefreshTokenStoreConfig {

    /** Survives API restarts when Redis is not running (local dev). */
    @Bean
    @Primary
    @ConditionalOnMissingBean(StringRedisTemplate.class)
    RefreshTokenStore jdbcRefreshTokenStore(JdbcTemplate jdbcTemplate) {
        return new JdbcRefreshTokenStore(jdbcTemplate);
    }

    @Bean
    @Primary
    @ConditionalOnBean(StringRedisTemplate.class)
    RefreshTokenStore redisRefreshTokenStore(StringRedisTemplate redisTemplate) {
        return new RedisRefreshTokenStore(redisTemplate);
    }
}
