import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import NewsCard from "../components/NewsCard";
import styles from "../styles/NewsList.module.css";

export default function NewsList() {
  const [articles, setArticles] = useState([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    async function fetchArticles() {
      try {
        setStatus('Fetching news articles...');
        const res = await axios.get('http://localhost:5000/api/admin/news');
        setArticles(res.data);
        setStatus('');
      } catch (error) {
        setStatus(`Failed to load articles: ${error.message || error}`);
      }
    }
    fetchArticles();
  }, []);

  return (
    <div>
      <Navbar />
      <div style={{ backgroundColor: '#f8f8f8', paddingTop: '60px', minHeight: '100vh' }}>
        <div className="container">
          <div className={styles.header}>
            <h1 className={styles.title}>Latest News & Updates</h1>
            <p className={styles.subTitle}>Stay updated with our platform’s latest news and articles.</p>
          </div>
          <div className={styles.articlesSection}>
            <h2 className='mb-4'>Browse News</h2>
            {status && <p>{status}</p>}
            <div className={styles.grid}>
              {articles.map(article => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
