import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import styles from "../styles/NewsDetail.module.css";

export default function NewsDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [otherArticles, setOtherArticles] = useState([]);
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  // Fetch the main article
  useEffect(() => {
    async function fetchArticle() {
      setStatus("Loading...");
      try {
        const res = await axios.get(`http://localhost:5000/api/admin/news/${id}`);
        setArticle(res.data);
        setStatus("");
      } catch (error) {
        setStatus("Article not found.");
      }
    }
    fetchArticle();
  }, [id]);

  // Fetch other articles (excluding current)
  useEffect(() => {
    async function fetchOthers() {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/news");
        // Filter out current article
        setOtherArticles(res.data.filter(a => String(a.id) !== String(id)));
      } catch (error) {
        setOtherArticles([]);
      }
    }
    fetchOthers();
  }, [id]);

  if (status) {
    return (
      <div>
        <Navbar />
        <div className={styles.detailContainer}>
          <p>{status}</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!article) return null;

  const backendBase = "http://localhost:5000";
  let image = backendBase + "/default-news.png";
  if (article.cover_image_url) {
    image = article.cover_image_url.startsWith("http")
      ? article.cover_image_url
      : backendBase + article.cover_image_url;
  }

  return (
    <div>
      <Navbar />
      <div className={styles.detailContainer}>
        <div className={styles.bannerWrapper}>
          <img src={image} alt={article.title} className={styles.coverImg} />
          <div className={styles.overlayText}>
            <div className={styles.title}>News Article</div>
          </div>
        </div>
        <div className="container">
          <div className={styles.date}>
            Posted: {new Date(article.created_at).toLocaleDateString()}
          </div>
          <div className="row">
            <div className="col-md-8">
              <h1 className={styles.newsTitle}>{article.title}</h1>
              <div className={styles.imgWrapper}>
                <img src={image} className={styles.newsImg} />
              </div>
              <div className={styles.content}>
                <div dangerouslySetInnerHTML={{ __html: article.content }} />
              </div>
            </div>
            <div className="col-md-4">
              <div className={styles.sidebar}>
                <h4 className={styles.sidebarTitle}>Other News</h4>
                <ul className={styles.otherNewsList}>
                  {otherArticles.length === 0 && (
                    <li style={{ color: "#aaa" }}>No other news found.</li>
                  )}
                  {otherArticles.map((a, idx) => {
                    let thumb = backendBase + "/default-news.png";
                    if (a.cover_image_url) {
                      thumb = a.cover_image_url.startsWith("http")
                        ? a.cover_image_url
                        : backendBase + a.cover_image_url;
                    }
                    return (
                      <li key={a.id} className={styles.otherNewsItem}>
                        <Link to={`/news/${a.id}`} className={styles.otherNewsLink}>
                          {/* Numbering */}
                          <div className={styles.otherNewsNumber}>{idx + 1}</div>
                          {/* Info */}
                          <div className={styles.otherNewsInfo}>
                            <div className={styles.otherNewsTitle}>{a.title}</div>
                            <div className={styles.otherNewsDate}>
                              {new Date(a.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          {/* Thumbnail on right, bigger */}
                          <div className={styles.otherNewsThumbWrap}>
                            <img src={thumb} alt={a.title} className={styles.otherNewsThumb} />
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
