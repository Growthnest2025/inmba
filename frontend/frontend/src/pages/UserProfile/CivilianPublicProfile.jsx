import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicProfile } from "../../services/publicProfile.service";

export default function CivilianPublicProfile({
    user = {},
    publicViewOnly = true,
    onSaveProfile,
    onUploadPhoto,
}) {
    const { loginId = "" } = useParams();
    const [loading, setLoading] = useState(!Object.keys(user || {}).length);
    const [loadError, setLoadError] = useState("");
    const photoInputRef = useRef(null);

    const [profile, setProfile] = useState(user);
    const [draft, setDraft] = useState(user);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [toast, setToast] = useState("");

    useEffect(() => {
        if (Object.keys(user || {}).length) {
            setProfile(user);
            setDraft(user);
            setLoading(false);
            return;
        }

        if (!loginId) {
            setLoading(false);
            setLoadError("Member Login ID is required.");
            return;
        }

        const controller = new AbortController();
        setLoading(true);
        setLoadError("");

        getPublicProfile(loginId, { signal: controller.signal })
            .then((data) => {
                const loaded = data?.profile || data?.user || data || {};
                setProfile(loaded);
                setDraft(loaded);
            })
            .catch((error) => {
                if (error?.name !== "AbortError" && error?.name !== "CanceledError") {
                    console.error("Civilian public profile load error:", error);
                    setLoadError(error?.message || "Unable to load public profile.");
                }
            })
            .finally(() => setLoading(false));

        return () => controller.abort();
    }, [user, loginId]);

    const fullName = useMemo(() => {
        return [profile.first_name, profile.last_name]
            .filter(Boolean)
            .join(" ")
            .trim() || "INMBA Member";
    }, [profile.first_name, profile.last_name]);

    const directNetwork =
        Number(profile.direct_network) || 0;

    const indirectNetwork =
        Number(profile.indirect_network) || 0;

    const totalInfluence =
        directNetwork + indirectNetwork;

    const socials = [
        {
            key: "social_instagram",
            label: "Instagram",
            icon: "fab fa-instagram",
            className: "sp-instagram",
            iconColor: "#c13584",
            placeholder:
                "https://instagram.com/yourhandle",
        },
        {
            key: "social_linkedin",
            label: "LinkedIn",
            icon: "fab fa-linkedin",
            className: "sp-linkedin",
            iconColor: "#0077b5",
            placeholder:
                "https://linkedin.com/in/yourprofile",
        },
        {
            key: "social_twitter",
            label: "X / Twitter",
            icon: "fab fa-x-twitter",
            className: "sp-twitter",
            iconColor: "#333333",
            placeholder:
                "https://x.com/yourhandle",
        },
        {
            key: "social_facebook",
            label: "Facebook",
            icon: "fab fa-facebook",
            className: "sp-facebook",
            iconColor: "#1877f2",
            placeholder:
                "https://facebook.com/yourprofile",
        },
        {
            key: "social_youtube",
            label: "YouTube",
            icon: "fab fa-youtube",
            className: "sp-youtube",
            iconColor: "#ff0000",
            placeholder:
                "https://youtube.com/@yourchannel",
        },
    ];

    const showToast = (message) => {
        setToast(message);

        window.setTimeout(() => {
            setToast("");
        }, 2400);
    };

    const updateDraft = (field, value) => {
        setDraft((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const toggleEditMode = () => {
        if (publicViewOnly) return;
        if (editMode) {
            setDraft(profile);
            setEditMode(false);
            return;
        }

        setDraft(profile);
        setEditMode(true);
    };

    const saveAllChanges = async () => {
        setSaving(true);

        const payload = {
            profession:
                draft.profession || null,
            city_profile:
                draft.city_profile || null,
            bio:
                draft.bio || null,
            dob:
                draft.dob || null,
            occupation:
                draft.occupation || null,
            social_instagram:
                draft.social_instagram || null,
            social_linkedin:
                draft.social_linkedin || null,
            social_twitter:
                draft.social_twitter || null,
            social_facebook:
                draft.social_facebook || null,
            social_youtube:
                draft.social_youtube || null,
        };

        try {
            if (onSaveProfile) {
                const result =
                    await onSaveProfile(payload);

                if (result === false) {
                    throw new Error(
                        "Profile save failed."
                    );
                }

                if (
                    result &&
                    typeof result === "object"
                ) {
                    setProfile((current) => ({
                        ...current,
                        ...result,
                    }));
                } else {
                    setProfile((current) => ({
                        ...current,
                        ...payload,
                    }));
                }
            } else {
                setProfile((current) => ({
                    ...current,
                    ...payload,
                }));
            }

            setEditMode(false);
            showToast("✅ Profile saved!");
        } catch (error) {
            console.error(
                "Profile save failed:",
                error
            );

            showToast(
                "❌ Save failed. Try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoChange = async (
        event
    ) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            showToast(
                "❌ Max 2 MB allowed."
            );
            event.target.value = "";
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (
            !allowedTypes.includes(file.type)
        ) {
            showToast(
                "❌ JPG, PNG or WEBP only."
            );
            event.target.value = "";
            return;
        }

        setUploading(true);
        showToast("⏳ Uploading...");

        try {
            let photoUrl =
                URL.createObjectURL(file);

            if (onUploadPhoto) {
                const result =
                    await onUploadPhoto(file);

                if (result === false) {
                    throw new Error(
                        "Photo upload failed."
                    );
                }

                if (
                    typeof result === "string"
                ) {
                    photoUrl = result;
                }

                if (result?.photo_url) {
                    photoUrl =
                        result.photo_url;
                }

                if (result?.profile_pic) {
                    photoUrl =
                        result.profile_pic;
                }
            }

            setProfile((current) => ({
                ...current,
                profile_pic_url:
                    photoUrl,
            }));

            setDraft((current) => ({
                ...current,
                profile_pic_url:
                    photoUrl,
            }));

            showToast(
                "✅ Photo updated!"
            );
        } catch (error) {
            console.error(
                "Photo upload failed:",
                error
            );

            showToast(
                "❌ Upload error."
            );
        } finally {
            setUploading(false);

            if (
                photoInputRef.current
            ) {
                photoInputRef.current.value =
                    "";
            }
        }
    };

    const copyText = async (
        text,
        message = "✅ Copied!"
    ) => {
        if (!text) {
            return;
        }

        try {
            await navigator.clipboard.writeText(
                text
            );

            showToast(message);
        } catch {
            showToast(
                "❌ Copy failed."
            );
        }
    };

    const shareLink = async (url) => {
        if (!url) {
            return;
        }

        try {
            if (navigator.share) {
                await navigator.share({
                    title:
                        "Join Inmba Network",
                    url,
                });
            } else {
                await copyText(url);
            }
        } catch {
            // User can cancel native share without treating it as an error.
        }
    };

    const formatDate = (value) => {
        if (!value) {
            return "—";
        }

        try {
            const date =
                new Date(value);

            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return value;
            }

            return new Intl.DateTimeFormat(
                "en-IN",
                {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                }
            ).format(date);
        } catch {
            return value;
        }
    };

    const profilePhoto =
        profile.profile_pic_url ||
        profile.profile_pic ||
        "";

    const referralLink =
        profile.referral_link || "";

    if (loading) {
        return <div style={{ minHeight: "70vh", display: "grid", placeItems: "center", fontFamily: "Arial, sans-serif" }}>Loading public profile...</div>;
    }

    if (loadError) {
        return <div style={{ minHeight: "70vh", display: "grid", placeItems: "center", fontFamily: "Arial, sans-serif", padding: 24, textAlign: "center" }}>{loadError}</div>;
    }

    return (
        <>
            <main className="public-profile-page">
                <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="photo-input"
                    onChange={
                        handlePhotoChange
                    }
                />

                <div className="page-wrap">
                    {/* =========================
              EDIT BANNER
             ========================= */}
                    {editMode && (
                        <div className="edit-banner show">
                            <div className="edit-banner-left">
                                <i className="fas fa-pen-to-square" />
                                <span>
                                    Edit mode — change the
                                    fields below
                                </span>
                            </div>

                            <button
                                type="button"
                                className="save-all-btn"
                                disabled={saving}
                                onClick={saveAllChanges}
                            >
                                <i
                                    className={
                                        saving
                                            ? "fas fa-spinner fa-spin"
                                            : "fas fa-save"
                                    }
                                />

                                {saving
                                    ? "Saving..."
                                    : "Save All"}
                            </button>
                        </div>
                    )}

                    <article
                        className={`profile-card ${editMode
                                ? "edit-mode"
                                : ""
                            }`}
                    >
                        {/* =========================
                HERO
               ========================= */}
                        <section className="hero">
                            <button
                                type="button"
                                className={`edit-toggle ${editMode
                                        ? "active"
                                        : ""
                                    }`}
                                onClick={
                                    toggleEditMode
                                }
                            >
                                <i
                                    className={
                                        editMode
                                            ? "fas fa-xmark"
                                            : "fas fa-pen"
                                    }
                                />
                                <span>
                                    {editMode
                                        ? "Cancel"
                                        : "Edit Profile"}
                                </span>
                            </button>

                            <div className="avatar-wrap">
                                {profilePhoto ? (
                                    <img
                                        className="avatar-img"
                                        src={profilePhoto}
                                        alt="Profile"
                                    />
                                ) : (
                                    <div className="avatar-fallback">
                                        <i className="fas fa-user-circle" />
                                    </div>
                                )}

                                {editMode && (
                                    <button
                                        type="button"
                                        className="avatar-upload-overlay"
                                        disabled={uploading}
                                        onClick={() =>
                                            photoInputRef.current?.click()
                                        }
                                        aria-label="Upload profile photo"
                                    >
                                        <i
                                            className={
                                                uploading
                                                    ? "fas fa-spinner fa-spin"
                                                    : "fas fa-camera"
                                            }
                                        />
                                    </button>
                                )}
                            </div>

                            <div className="hero-name">
                                {fullName}
                            </div>

                            <div className="hero-sub">
                                {editMode ? (
                                    <>
                                        <input
                                            className="hero-inline-input"
                                            value={
                                                draft.profession ||
                                                ""
                                            }
                                            onChange={(event) =>
                                                updateDraft(
                                                    "profession",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Add profession..."
                                        />

                                        <span>·</span>

                                        <input
                                            className="hero-inline-input"
                                            value={
                                                draft.city_profile ||
                                                ""
                                            }
                                            onChange={(event) =>
                                                updateDraft(
                                                    "city_profile",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Add city..."
                                        />
                                    </>
                                ) : (
                                    <>
                                        {profile.profession ||
                                            ""}
                                        {(profile.profession ||
                                            profile.city_profile) &&
                                            " · "}
                                        {profile.city_profile ||
                                            ""}
                                    </>
                                )}
                            </div>

                            {editMode ? (
                                <textarea
                                    className="hero-bio hero-bio-input"
                                    value={draft.bio || ""}
                                    onChange={(event) =>
                                        updateDraft(
                                            "bio",
                                            event.target.value
                                        )
                                    }
                                    placeholder="Write a short bio about yourself..."
                                />
                            ) : (
                                <div className="hero-bio">
                                    {profile.bio || ""}
                                </div>
                            )}
                        </section>

                        {/* =========================
                BODY
               ========================= */}
                        <div className="card-body">
                            <section className="section">
                                <div className="section-label">
                                    <i className="fas fa-id-card" />
                                    Personal Info
                                </div>

                                <div className="info-grid">
                                    <InfoRow
                                        icon="fas fa-hashtag"
                                        label="Login ID"
                                        value={
                                            profile.login_id ||
                                            "—"
                                        }
                                        readonly
                                    />

                                    <InfoRow
                                        icon="fas fa-phone"
                                        label="Mobile"
                                        value={
                                            profile.phone ||
                                            "—"
                                        }
                                        readonly
                                        onClick={() =>
                                            copyText(
                                                profile.phone
                                            )
                                        }
                                    />

                                    <InfoRow
                                        icon="fas fa-envelope"
                                        label="Email"
                                        value={
                                            profile.email ||
                                            "—"
                                        }
                                        readonly
                                        onClick={() =>
                                            copyText(
                                                profile.email
                                            )
                                        }
                                    />

                                    <InfoRow
                                        icon="fas fa-map-pin"
                                        label="District"
                                        value={
                                            profile.entity_district ||
                                            "—"
                                        }
                                        readonly
                                    />

                                    <EditableInfoRow
                                        editMode={editMode}
                                        icon="fas fa-cake-candles"
                                        label="Date of Birth"
                                        displayValue={formatDate(
                                            editMode
                                                ? draft.dob
                                                : profile.dob
                                        )}
                                        type="date"
                                        value={
                                            draft.dob || ""
                                        }
                                        onChange={(value) =>
                                            updateDraft(
                                                "dob",
                                                value
                                            )
                                        }
                                    />

                                    <EditableInfoRow
                                        editMode={editMode}
                                        icon="fas fa-briefcase"
                                        label="Occupation"
                                        displayValue={
                                            editMode
                                                ? draft.occupation ||
                                                "—"
                                                : profile.occupation ||
                                                "—"
                                        }
                                        value={
                                            draft.occupation ||
                                            ""
                                        }
                                        placeholder="Your occupation"
                                        onChange={(value) =>
                                            updateDraft(
                                                "occupation",
                                                value
                                            )
                                        }
                                    />
                                </div>
                            </section>

                            <div className="divider" />

                            {/* =========================
                  SOCIAL
                 ========================= */}
                            <section className="section">
                                <div className="section-label">
                                    <i className="fas fa-share-nodes" />
                                    Social Media
                                </div>

                                <div className="social-wrap">
                                    {!editMode ? (
                                        <div className="social-grid">
                                            {socials.some(
                                                (item) =>
                                                    profile[
                                                    item.key
                                                    ]
                                            ) ? (
                                                socials.map(
                                                    (social) =>
                                                        profile[
                                                            social.key
                                                        ] ? (
                                                            <a
                                                                key={
                                                                    social.key
                                                                }
                                                                href={
                                                                    profile[
                                                                    social.key
                                                                    ]
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className={`social-pill ${social.className}`}
                                                            >
                                                                <i
                                                                    className={
                                                                        social.icon
                                                                    }
                                                                />
                                                                {
                                                                    social.label
                                                                }
                                                            </a>
                                                        ) : null
                                                )
                                            ) : (
                                                <span className="no-social-msg">
                                                    <i className="fas fa-plus-circle" />{" "}
                                                    Click{" "}
                                                    <strong>
                                                        Edit Profile
                                                    </strong>{" "}
                                                    to add social
                                                    links.
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="social-edit-grid active">
                                            {socials.map(
                                                (social) => (
                                                    <div
                                                        className="social-edit-row"
                                                        key={
                                                            social.key
                                                        }
                                                    >
                                                        <i
                                                            className={
                                                                social.icon
                                                            }
                                                            style={{
                                                                color:
                                                                    social.iconColor,
                                                            }}
                                                        />

                                                        <input
                                                            type="url"
                                                            value={
                                                                draft[
                                                                social.key
                                                                ] || ""
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateDraft(
                                                                    social.key,
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder={
                                                                social.placeholder
                                                            }
                                                        />
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            </section>

                            <div className="divider" />

                            {/* =========================
                  REFERRAL
                 ========================= */}
                            <section className="section">
                                <div className="section-label">
                                    <i className="fas fa-link" />
                                    Your Referral Link
                                </div>

                                <div className="referral-box">
                                    {referralLink ? (
                                        <>
                                            <div className="ref-link-text">
                                                {referralLink}
                                            </div>

                                            <div className="ref-actions">
                                                <button
                                                    type="button"
                                                    className="btn-ref btn-ref-copy"
                                                    onClick={() =>
                                                        copyText(
                                                            referralLink
                                                        )
                                                    }
                                                >
                                                    <i className="fas fa-copy" />
                                                    Copy
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn-ref btn-ref-share"
                                                    onClick={() =>
                                                        shareLink(
                                                            referralLink
                                                        )
                                                    }
                                                >
                                                    <i className="fas fa-share-alt" />
                                                    Share
                                                </button>

                                                <a
                                                    className="btn-ref btn-ref-wa"
                                                    href={`https://wa.me/?text=${encodeURIComponent(
                                                        `Join Inmba Network! Use my referral: ${referralLink}`
                                                    )}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <i className="fab fa-whatsapp" />
                                                    WhatsApp
                                                </a>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="referral-empty">
                                            <i className="fas fa-hourglass-half" />{" "}
                                            Referral link will
                                            appear after approval.
                                        </div>
                                    )}
                                </div>
                            </section>

                            <div className="divider" />

                            {/* =========================
                  NETWORK
                 ========================= */}
                            <section className="section">
                                <div className="section-label">
                                    <i className="fas fa-chart-line" />
                                    Network Strength
                                </div>

                                <div className="network-grid">
                                    <div className="net-stat">
                                        <div className="net-num">
                                            {directNetwork}
                                        </div>
                                        <div className="net-label">
                                            <i className="fas fa-arrow-turn-down" />{" "}
                                            Direct
                                        </div>
                                        <div className="net-sub">
                                            Level 1 referrals
                                        </div>
                                    </div>

                                    <div className="net-stat">
                                        <div className="net-num">
                                            {indirectNetwork}
                                        </div>
                                        <div className="net-label">
                                            <i className="fas fa-share-nodes" />{" "}
                                            Indirect
                                        </div>
                                        <div className="net-sub">
                                            Extended network
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <div className="total-pill">
                                        <i className="fas fa-users" />
                                        Total Influence:{" "}
                                        {totalInfluence}
                                    </div>
                                </div>
                            </section>
                        </div>

                        <footer className="card-footer-strip">
                            <div className="verified-badge">
                                <i className="fas fa-circle-check" />
                                Inmba Verified Member
                            </div>

                            <span>
                                {profile.login_id ||
                                    ""}
                            </span>
                        </footer>
                    </article>
                </div>

                {toast && (
                    <div className="profile-toast">
                        {toast}
                    </div>
                )}
            </main>

            {/* =========================================================
          CSS - KEPT AT THE END OF THE SAME FILE
         ========================================================= */}
            <style>{`
        :root {
          --green-900: #0a3d0a;
          --green-700: #0f4d0f;
          --green-500: #1a7a1a;
          --green-300: #4caf50;
          --green-100: #e8f5e9;
          --green-50: #f1faf1;
          --leaf: #2d7a35;
          --text-dark: #1a2e1a;
          --text-mid: #4a6741;
          --text-soft: #7a9e72;
          --border: #d4e8c0;
          --card-bg: #ffffff;
          --page-bg: #edf2e6;
        }

        * {
          box-sizing: border-box;
        }

        .public-profile-page {
          min-height: 100vh;
          padding: 2rem 1rem;
          background:
            var(--page-bg);
          font-family:
            "DM Sans",
            "Poppins",
            sans-serif;
        }

        .photo-input {
          display: none;
        }

        .page-wrap {
          width: 100%;
          max-width: 560px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin: 0 auto;
        }

        /* =========================
           Edit Banner
           ========================= */
        .edit-banner {
          display: flex;
          align-items: center;
          justify-content:
            space-between;
          gap: 12px;
          padding: .6rem 1rem;
          border-radius: .8rem;
          background:
            var(--green-700);
          color: #c8f5c8;
          font-size: .78rem;
          font-weight: 600;
        }

        .edit-banner-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .save-all-btn {
          padding: 5px 14px;
          border: 0;
          border-radius: 50px;
          background: #c8f5c8;
          color:
            var(--green-900);
          font-size: .75rem;
          font-weight: 700;
          cursor: pointer;
        }

        .save-all-btn:hover:not(:disabled) {
          background: #ffffff;
        }

        .save-all-btn:disabled {
          opacity: .65;
          cursor: not-allowed;
        }

        /* =========================
           Card / Hero
           ========================= */
        .profile-card {
          overflow: hidden;
          border-radius: 1.8rem;
          background:
            var(--card-bg);
          box-shadow:
            0 8px 32px
            rgba(15,77,15,.12);
        }

        .hero {
          position: relative;
          padding:
            2rem 1.5rem 1.5rem;
          background:
            linear-gradient(
              160deg,
              var(--green-900)
              0%,
              var(--leaf)
              100%
            );
          text-align: center;
        }

        .edit-toggle {
          position: absolute;
          top: 1rem;
          right: 1rem;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border:
            1px solid
            rgba(255,255,255,.25);
          border-radius: 50px;
          background:
            rgba(255,255,255,.15);
          color: #ffffff;
          font-size: .72rem;
          font-weight: 600;
          cursor: pointer;
          backdrop-filter: blur(4px);
        }

        .edit-toggle.active {
          background:
            rgba(255,255,255,.9);
          color:
            var(--green-700);
        }

        .avatar-wrap {
          position: relative;
          width: 88px;
          height: 88px;
          margin:
            0 auto 1rem;
        }

        .avatar-img,
        .avatar-fallback {
          width: 88px;
          height: 88px;
          border:
            3px solid
            rgba(255,255,220,.4);
          border-radius: 50%;
        }

        .avatar-img {
          object-fit: cover;
        }

        .avatar-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            rgba(255,255,230,.15);
        }

        .avatar-fallback i {
          color:
            rgba(255,255,220,.8);
          font-size: 2.2rem;
        }

        .avatar-upload-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 50%;
          background:
            rgba(0,0,0,.45);
          color: #ffffff;
          cursor: pointer;
        }

        .hero-name {
          margin-bottom: .3rem;
          color: #ffffff;
          font-family:
            "DM Serif Display",
            Georgia,
            serif;
          font-size: 1.55rem;
          line-height: 1.2;
        }

        .hero-sub {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: .4rem;
          color: #c8e6c9;
          font-size: .8rem;
        }

        .hero-inline-input {
          width: 130px;
          padding: 3px 7px;
          border:
            1px dashed
            rgba(255,255,220,.4);
          border-radius: 6px;
          outline: 0;
          background:
            rgba(255,255,255,.12);
          color: #ffffff;
          font: inherit;
          text-align: center;
        }

        .hero-inline-input::placeholder,
        .hero-bio-input::placeholder {
          color:
            rgba(255,255,255,.55);
        }

        .hero-bio {
          max-width: 340px;
          margin: .5rem auto 0;
          color: #a5d6a7;
          font-size: .78rem;
          font-style: italic;
        }

        .hero-bio-input {
          width: min(100%, 340px);
          min-height: 56px;
          padding: 6px 8px;
          border:
            1px dashed
            rgba(255,255,220,.4);
          border-radius: 8px;
          outline: 0;
          background:
            rgba(255,255,255,.12);
          resize: vertical;
          font-family: inherit;
          text-align: center;
        }

        /* =========================
           Body / Info
           ========================= */
        .card-body {
          padding: 1.5rem;
        }

        .section {
          margin-bottom: 1.2rem;
        }

        .section-label {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: .6rem;
          color:
            var(--text-soft);
          font-size: .65rem;
          font-weight: 700;
          letter-spacing: .8px;
          text-transform: uppercase;
        }

        .info-grid {
          display: flex;
          flex-direction: column;
          gap: .15rem;
        }

        .info-row {
          display: flex;
          align-items: center;
          gap: .75rem;
          padding: .6rem .5rem;
          border-radius: .7rem;
          transition: background .15s;
        }

        .info-row.clickable {
          cursor: pointer;
        }

        .info-row:hover {
          background:
            var(--green-50);
        }

        .info-row.readonly {
          opacity: .78;
        }

        .info-icon {
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background:
            var(--green-100);
          color:
            var(--green-700);
          font-size: .9rem;
        }

        .info-content {
          min-width: 0;
          flex: 1;
        }

        .info-key {
          margin-bottom: 1px;
          color:
            var(--text-soft);
          font-size: .65rem;
          font-weight: 700;
          letter-spacing: .5px;
          text-transform: uppercase;
        }

        .info-val {
          color:
            var(--text-dark);
          font-size: .92rem;
          font-weight: 600;
        }

        .inline-input {
          width: 100%;
          padding: 2px 4px;
          border: 0;
          border-radius: 4px;
          outline: 0;
          background: transparent;
          color:
            var(--text-dark);
          font-family: inherit;
          font-size: .92rem;
          font-weight: 600;
        }

        .edit-mode .info-row:not(.readonly) {
          border:
            1px solid
            var(--border);
          background:
            var(--green-50);
        }

        .inline-input:focus {
          background: #ffffff;
        }

        .divider {
          height: 1px;
          margin: 1rem 0;
          background:
            linear-gradient(
              90deg,
              transparent,
              var(--border),
              transparent
            );
        }

        /* =========================
           Social
           ========================= */
        .social-wrap {
          padding: 1rem;
          border:
            1px solid
            var(--border);
          border-radius: 1rem;
          background:
            var(--green-50);
        }

        .social-grid {
          display: flex;
          flex-wrap: wrap;
          gap: .5rem;
        }

        .social-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border:
            1px solid transparent;
          border-radius: 50px;
          font-size: .76rem;
          font-weight: 600;
          text-decoration: none;
          transition: .2s;
        }

        .social-pill:hover {
          transform:
            translateY(-1px);
        }

        .sp-instagram {
          border-color: #f8bbd9;
          background: #fce4ec;
          color: #880e4f;
        }

        .sp-linkedin {
          border-color: #bbdefb;
          background: #e3f2fd;
          color: #0d47a1;
        }

        .sp-twitter {
          border-color: #c8e6c9;
          background: #e8f5e9;
          color: #1b5e20;
        }

        .sp-facebook {
          border-color: #c5cae9;
          background: #e8eaf6;
          color: #1a237e;
        }

        .sp-youtube {
          border-color: #ffcdd2;
          background: #fce4e4;
          color: #b71c1c;
        }

        .no-social-msg {
          color:
            var(--text-soft);
          font-size: .8rem;
          font-style: italic;
        }

        .social-edit-grid {
          display: flex;
          flex-direction: column;
          gap: .5rem;
        }

        .social-edit-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border:
            1.5px solid
            var(--border);
          border-radius: .6rem;
          background: #ffffff;
        }

        .social-edit-row i {
          width: 18px;
          font-size: 1rem;
          text-align: center;
        }

        .social-edit-row input {
          flex: 1;
          border: 0;
          outline: 0;
          background: transparent;
          color:
            var(--text-dark);
          font-family: inherit;
          font-size: .8rem;
        }

        /* =========================
           Referral
           ========================= */
        .referral-box {
          padding: 1rem;
          border:
            1px solid
            var(--border);
          border-radius: 1rem;
          background:
            linear-gradient(
              135deg,
              var(--green-50),
              #e8f5e2
            );
        }

        .ref-link-text {
          margin-bottom: .7rem;
          padding:
            .45rem .7rem;
          border:
            1px solid
            var(--border);
          border-radius: .5rem;
          background: #ffffff;
          color:
            var(--green-700);
          font-family:
            "Courier New",
            monospace;
          font-size: .78rem;
          font-weight: 600;
          word-break: break-all;
        }

        .ref-actions {
          display: flex;
          flex-wrap: wrap;
          gap: .5rem;
        }

        .btn-ref {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: 0;
          border-radius: 50px;
          font-size: .76rem;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: .2s;
        }

        .btn-ref:hover {
          transform:
            translateY(-1px);
        }

        .btn-ref-copy {
          background:
            var(--green-700);
          color: #ffffff;
        }

        .btn-ref-share {
          background:
            var(--green-500);
          color: #ffffff;
        }

        .btn-ref-wa {
          background: #25d366;
          color: #ffffff;
        }

        .referral-empty {
          padding: .5rem 0;
          color: #9bb88b;
          font-size: .82rem;
          text-align: center;
        }

        /* =========================
           Network
           ========================= */
        .network-grid {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: .75rem;
        }

        .net-stat {
          padding: 1rem;
          border:
            1px solid
            var(--border);
          border-radius: 1rem;
          background:
            var(--green-50);
          text-align: center;
          transition: .2s;
        }

        .net-stat:hover {
          border-color: #9dc98a;
          transform:
            translateY(-1px);
        }

        .net-num {
          color:
            var(--green-700);
          font-family:
            "DM Serif Display",
            Georgia,
            serif;
          font-size: 2.2rem;
          line-height: 1;
        }

        .net-label {
          margin-top: 4px;
          color:
            var(--text-soft);
          font-size: .7rem;
          font-weight: 700;
          letter-spacing: .4px;
          text-transform: uppercase;
        }

        .net-sub {
          margin-top: 3px;
          color: #9bb88b;
          font-size: .6rem;
        }

        .total-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: .75rem;
          padding:
            .45rem 1rem;
          border-radius: 50px;
          background:
            var(--green-100);
          color:
            var(--green-700);
          font-size: .72rem;
          font-weight: 700;
        }

        /* =========================
           Footer / Toast
           ========================= */
        .card-footer-strip {
          display: flex;
          align-items: center;
          justify-content:
            space-between;
          padding:
            .8rem 1.5rem;
          border-top:
            1px solid
            var(--border);
          background:
            var(--green-50);
          color:
            var(--text-soft);
          font-size: .68rem;
        }

        .verified-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          color:
            var(--green-700);
          font-weight: 700;
        }

        .profile-toast {
          position: fixed;
          bottom: 28px;
          left: 50%;
          z-index: 9999;
          padding:
            10px 22px;
          border-radius: 50px;
          background:
            var(--green-900);
          color: #ffffff;
          font-size: .82rem;
          font-weight: 600;
          white-space: nowrap;
          box-shadow:
            0 6px 20px
            rgba(0,0,0,.25);
          transform:
            translateX(-50%);
        }

        @media (max-width: 480px) {
          .public-profile-page {
            padding:
              1rem .6rem;
          }

          .hero {
            padding:
              1.5rem 1rem 1.2rem;
          }

          .card-body {
            padding: 1.1rem;
          }

          .net-num {
            font-size: 1.8rem;
          }

          .edit-toggle {
            top: .7rem;
            right: .7rem;
          }
        }
      `}</style>
        </>
    );
}

function InfoRow({
    icon,
    label,
    value,
    readonly = false,
    onClick,
}) {
    return (
        <div
            className={`info-row ${readonly
                    ? "readonly"
                    : ""
                } ${onClick
                    ? "clickable"
                    : ""
                }`}
            onClick={onClick}
        >
            <div className="info-icon">
                <i className={icon} />
            </div>

            <div className="info-content">
                <div className="info-key">
                    {label}
                </div>

                <div className="info-val">
                    {value}
                </div>
            </div>
        </div>
    );
}

function EditableInfoRow({
    editMode,
    icon,
    label,
    displayValue,
    value,
    onChange,
    type = "text",
    placeholder = "",
}) {
    return (
        <div className="info-row">
            <div className="info-icon">
                <i className={icon} />
            </div>

            <div className="info-content">
                <div className="info-key">
                    {label}
                </div>

                {editMode ? (
                    <input
                        className="inline-input"
                        type={type}
                        value={value}
                        onChange={(event) =>
                            onChange(
                                event.target.value
                            )
                        }
                        placeholder={
                            placeholder
                        }
                    />
                ) : (
                    <div className="info-val">
                        {displayValue}
                    </div>
                )}
            </div>
        </div>
    );
}