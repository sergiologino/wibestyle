"use client";

import { useEffect, useState } from "react";
import type { PublishedReview } from "@wibestyle/shared-types";
import { createLandingApi } from "@/lib/api";

const interestFallback = [
  { title: "Платья с WB", text: "Хочу примерить летние платья до заказа." },
  { title: "Обувь и сумки", text: "Интересует, как кроссовки смотрятся в полный рост." },
  { title: "Полный look", text: "Жду макияж и причёски в одном образе." },
];

export default function PublishedReviewsSection() {
  const [reviews, setReviews] = useState<PublishedReview[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void createLandingApi()
      .listPublishedReviews()
      .then((data) => setReviews(data.items))
      .catch(() => setReviews([]))
      .finally(() => setLoaded(true));
  }, []);

  const showPublished = loaded && reviews.length > 0;

  return (
    <section className="reviews" aria-labelledby="reviews-title">
      <div className="container split-layout reviews-layout">
        <div>
          <h2 id="reviews-title">{showPublished ? "Отзывы пользователей" : "Что хотят примерить первыми"}</h2>
          <div className="review-grid">
            {showPublished
              ? reviews.slice(0, 6).map((review) => (
                  <article className="review-card" key={review.id}>
                    <b>{review.displayName}</b>
                    <span>{"★".repeat(review.rating)}</span>
                    <p>{review.body}</p>
                  </article>
                ))
              : interestFallback.map((item) => (
                  <article className="review-card" key={item.title}>
                    <b>{item.title}</b>
                    <p>{item.text}</p>
                  </article>
                ))}
          </div>
        </div>
        <aside className="privacy-card">
          <h3>Приватный режим</h3>
          <p>Фото в облегающей одежде. Лицо, фон и приметы можно скрыть перед обработкой.</p>
        </aside>
      </div>
    </section>
  );
}
