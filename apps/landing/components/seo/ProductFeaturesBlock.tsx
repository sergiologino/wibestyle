import { productFeatures } from "@/content/product-features";

export default function ProductFeaturesBlock() {
  const items = [productFeatures.memory, productFeatures.lookRating];

  return (
    <section className="product-features-block" aria-label="Умные возможности стилиста">
      <h2>Почему это не просто примерочная</h2>
      <div className="product-features-grid">
        {items.map((item) => (
          <article key={item.title} className="product-feature-card">
            <span className="product-feature-emoji" aria-hidden>
              {item.emoji}
            </span>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
