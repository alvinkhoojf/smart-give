import React from 'react';
import styles from '../styles/CompleteProfile.module.css';

export default function CompleteProfile({
  user,
  formData,
  handleInputChange,
  handleProfileUpdate,
}) {
  const isNgo = user?.role === 'ngo or go';

  return (
    <div className={styles.completeProfileRoot}>
      <h4 className={styles.completeProfileTitle}>Complete your profile</h4>
      <form
        onSubmit={handleProfileUpdate}
        encType="multipart/form-data"
        className={styles.profileForm}
      >
        {isNgo ? (
          <>
            <div className="mb-3">
              <label htmlFor="organization_name" className="form-label">Organization Name</label>
              <input
                type="text"
                className="form-control"
                id="organization_name"
                name="organization_name"
                value={formData.organization_name || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="organization_email" className="form-label">Organization Email</label>
              <input
                type="email"
                className="form-control"
                id="organization_email"
                name="organization_email"
                value={formData.organization_email || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="reg_number" className="form-label">Registration Number</label>
              <input
                type="text"
                className="form-control"
                id="reg_number"
                name="reg_number"
                value={formData.reg_number || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="reg_cert" className="form-label">Registration Certificate</label>
              <input
                type="file"
                className="form-control"
                id="reg_cert"
                name="reg_cert"
                onChange={e => handleInputChange({
                  target: { name: "reg_cert", value: e.target.files[0] }
                })}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="additional_doc" className="form-label">Additional Documents</label>
              <input
                type="file"
                className="form-control"
                id="additional_doc"
                name="additional_doc"
                onChange={e => handleInputChange({
                  target: { name: "additional_doc", value: e.target.files[0] }
                })}
              />
            </div>
            <div style={{display: "flex", justifyContent: "center", marginTop: 50}}>
              <button on type="submit" className={styles.completeProfileBtn}>Verify</button> 
            </div>
            <p className={styles.formHint}>*This will take 1-3 business days</p>
          </>
        ) : (
          <>
            <div className="mb-3">
              <label htmlFor="first_name" className="form-label">First Name</label>
              <input
                type="text"
                className="form-control"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="last_name" className="form-label">Last Name</label>
              <input
                type="text"
                className="form-control"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="country" className="form-label">Country</label>
              <input
                type="text"
                className="form-control"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
              />
            </div>
            <div style={{display: "flex", justifyContent: "center", marginTop: 50}}>
              <button type="submit" className={styles.completeProfileBtn}>Complete Profile</button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
