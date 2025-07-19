import React from 'react';
import { Link } from 'react-router-dom';
import styles from "../styles/NewsCard.module.css";

// Helper: Strip HTML tags, limit chars
function getShortText(html, maxChars = 150) {
  const text = html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return text.length <= maxChars ? text : text.slice(0, maxChars) + "...";
}

export default function NewsCard({ article }) {
  const backendBase = "http://localhost:5000";
  let image = backendBase + '/default-news.png';
  if (article.cover_image_url) {
    image = article.cover_image_url.startsWith('http')
      ? article.cover_image_url
      : backendBase + article.cover_image_url;
  }

  return (
    <div className={styles.newsCard}>
      <div className={styles.cardImgWrapper}>
        <img src={image} alt={article.title} className={styles.cardImg} />
      </div>
      <div className={styles.cardBody}>
        <h5 className={styles.cardTitle}>{article.title}</h5>
        <div className={styles.cardDate}>
          {new Date(article.created_at).toLocaleDateString()}
        </div>
        <div className={styles.cardDesc}>
          {getShortText(article.content, 150)}
        </div>
        <Link to={`/news/${article.id}`} className={styles.readMoreBtn}>
          Read More
        </Link>
      </div>
    </div>
  );
}
