package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "gallery_comments")
public class GalleryCommentEntity {

    @Id
    private UUID id;

    @Column(name = "post_id", nullable = false)
    private UUID postId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 1000)
    private String body;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected GalleryCommentEntity() {
    }

    public GalleryCommentEntity(UUID id, UUID postId, UUID userId, String body, Instant createdAt) {
        this.id = id;
        this.postId = postId;
        this.userId = userId;
        this.body = body;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getPostId() {
        return postId;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getBody() {
        return body;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
