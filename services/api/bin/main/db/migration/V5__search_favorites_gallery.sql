CREATE TABLE favorites (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    marketplace VARCHAR(32) NOT NULL,
    external_product_id VARCHAR(128) NOT NULL,
    product_title VARCHAR(255),
    product_brand VARCHAR(120),
    product_price_rub INT,
    product_image_url VARCHAR(512),
    product_url VARCHAR(512),
    product_sizes VARCHAR(255),
    note VARCHAR(512),
    tags VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_favorites_user_product ON favorites(user_id, marketplace, external_product_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);

CREATE TABLE gallery_posts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slug VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(255),
    description VARCHAR(512),
    image_url VARCHAR(512),
    try_on_session_id UUID REFERENCES try_on_sessions(id),
    visibility VARCHAR(32) NOT NULL,
    moderation_status VARCHAR(32) NOT NULL DEFAULT 'PUBLIC',
    product_link_visible BOOLEAN NOT NULL DEFAULT TRUE,
    product_visibility VARCHAR(32) NOT NULL DEFAULT 'SHOW_PRODUCT_LINK',
    marketplace VARCHAR(32),
    product_url VARCHAR(512),
    product_title VARCHAR(255),
    like_count INT NOT NULL DEFAULT 0,
    comment_count INT NOT NULL DEFAULT 0,
    elite_frame BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gallery_posts_visibility ON gallery_posts(visibility);
CREATE INDEX idx_gallery_posts_user_id ON gallery_posts(user_id);

CREATE TABLE gallery_likes (
    id UUID PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES gallery_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (post_id, user_id)
);

CREATE TABLE gallery_comments (
    id UUID PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES gallery_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gallery_comments_post_id ON gallery_comments(post_id);
