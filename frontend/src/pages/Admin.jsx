import React, { useState } from "react";
import PendingAccountsTab from "../components/admin/PendingAccount";
import PendingCampaignsTab from "../components/admin/PendingCampaigns";
import NewsArticleTab from "../components/admin/NewsArticleTab";

const USER = { name: "Admin" };
const THEME = "#FF416C";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("accounts");
  const tabs = [
    { key: "accounts", label: "Pending Accounts" },
    { key: "campaigns", label: "Pending Campaigns" },
    { key: "news", label: "News Article" },
  ];

  return (
    <div style={{ background: "#f7f9fb", minHeight: "100vh" }}>
      {/* NAVBAR */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 36px",
          background: "#fff",
          borderBottom: "1px solid lightgrey"
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 22, color: THEME }}>
          SmartGive
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <span style={{ color: "#444", fontWeight: 600 }}>
            {USER.name}
          </span>
          <button
            style={{
              padding: "7px 16px",
              background: "#f4f5f7",
              border: "none",
              borderRadius: 8,
              fontWeight: 500,
              color: "#7f8c8d",
              cursor: "pointer",
              transition: "background .2s",
            }}
            onClick={() => {
              // LOGOUT logic here
              window.location.href = "/logout";
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* MAIN SECTION */}
      <div className="container" style={{ marginTop: 40, padding: "0 12px" }}>
        {/* Title */}
        <h1 style={{ fontSize: 36, fontWeight: 700 }}>
          Admin Dashboard
        </h1>
        <div style={{ color: "#7888a1", marginBottom: 34, fontSize: 17 }}>
          Manage NGO accounts, campaigns, and news articles for the platform
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            borderBottom: `2px solid ${THEME}22`,
            marginBottom: 30,
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: "none",
                border: "none",
                outline: "none",
                fontWeight: 700,
                fontSize: 17,
                color: activeTab === tab.key ? THEME : "#778ca2",
                borderBottom:
                  activeTab === tab.key
                    ? `3px solid ${THEME}`
                    : "3px solid transparent",
                padding: "14px 22px 12px 22px",
                cursor: "pointer",
                transition: "color .2s, border-bottom .2s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Placeholder */}
        <div>
          {activeTab === "accounts" && <PendingAccountsTab />}
          {activeTab === "campaigns" && <PendingCampaignsTab />}
          {activeTab === "news" && <NewsArticleTab />}
        </div>
      </div>
    </div>
  );
}
