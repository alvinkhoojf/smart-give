import React, { useEffect, useState } from "react";
import Swal from 'sweetalert2';
const THEME = "#FF416C";

export default function PendingAccountsTab() {
  const [pendingNgos, setPendingNgos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch pending NGOs
  const fetchPendingNgos = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/pending-ngos');
      const data = await res.json();
      setPendingNgos(data);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Failed to load pending NGOs',
        text: error.message || 'Could not fetch NGOs.',
        confirmButtonColor: THEME
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPendingNgos();
  }, []);

  // Approve/Reject handler
  const handleAction = async (ngoId, status) => {
    try {
      await fetch(`http://localhost:5000/api/admin/ngo/${ngoId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await Swal.fire({
        icon: 'success',
        title: status === "verified" ? 'NGO Verified' : 'NGO Rejected',
        text: status === "verified"
          ? "The NGO account has been verified."
          : "The NGO account has been rejected.",
        confirmButtonColor: THEME
      });
      fetchPendingNgos();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Failed to update status',
        text: err.message || "Could not update NGO status.",
        confirmButtonColor: THEME
      });
    }
  };

  return (
    <div>
      {loading && <div>Loading NGOs...</div>}
      {!loading && pendingNgos.length === 0 && (
        <div style={{ color: "#aaa", minHeight: "51.7vh" }}>No NGOs pending verification.</div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
        {!loading && pendingNgos.map(ngo => (
          <div
            key={ngo.id}
            style={{
              background: "#fff",
              borderRadius: 16,
              border: `1px solid lightgrey`,
              padding: 28,
              minWidth: 320,
              maxWidth: 360,
              flex: "1 1 340px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              <span
                className="badge text-warning bg-warning-subtle mb-2"
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: 1,
                  padding: "7px 14px",
                  borderRadius: 8,
                }}
                >PENDING</span>
              <h3 style={{ fontSize: 20, fontWeight: 800, margin: "12px 0 2px" }}>
                {ngo.org_username}
              </h3>
              <div style={{ color: "#888", fontSize: 15, marginBottom: 12 }}>
                Reg No: <b>{ngo.reg_number}</b><br />
                Email: <b>{ngo.org_email}</b>
              </div>
              <div style={{ fontSize: 15, marginBottom: 8 }}>
                <a
                  href={`http://localhost:5000/uploads/${ngo.reg_cert}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "underline", marginRight: 12 }}>
                  Reg Certificate
                </a>
                {ngo.additional_doc &&
                  <a
                    href={`http://localhost:5000/uploads/${ngo.additional_doc}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "underline" }}>
                    Additional Document
                  </a>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 22 }}>
              <button
                style={{
                  flex: 1,
                  padding: "8px 0",
                  background: THEME,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 15
                }}
                onClick={() => handleAction(ngo.id, "verified")}
              >
                Verify
              </button>
              <button
                style={{
                  flex: 1,
                  padding: "8px 0",
                  background: "#fff",
                  color: THEME,
                  border: `2px solid ${THEME}`,
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 15
                }}
                onClick={() => handleAction(ngo.id, "rejected")}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
