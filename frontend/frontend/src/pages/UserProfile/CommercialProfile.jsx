//  இருக்குற code எல்லாம் delete பண்ணிட்டு **இதையே full-a paste பண்ணு**:

import {
  BIZ,
} from "./data";

import {
  Avatar,
  Banner,
  FGrid,
  PostGrid,
  Section,
  Skills,
  SocialGrid,
} from "./Shared";

/* =========================================================
   COMMERCIAL PROFILE HERO
========================================================= */

function CommercialProfilePage({
  avRef,
  onAvatarOpen,
}) {
  return (
    <div className="hero page-enter">
      {/* =================================================
          HERO BANNER
      ================================================= */}

      <div className="hero-banner">
        <Banner />
      </div>

      {/* =================================================
          HERO BODY
      ================================================= */}

      <div className="hero-body">
        <Avatar
          onOpen={
            onAvatarOpen
          }
          wrapRef={
            avRef
          }
          initials={
            BIZ.initials
          }
        />

        {/* =================================================
            STATUS
        ================================================= */}

        <div className="spill">
          <span className="sdot" />

          {BIZ.status}
        </div>

        {/* =================================================
            BUSINESS NAME
        ================================================= */}

        <div className="h-name">
          {BIZ.name}
        </div>

        {/* =================================================
            BUSINESS TYPE
        ================================================= */}

        <div className="h-role">
          {BIZ.businessType} Company
        </div>

        {/* =================================================
            TAGLINE
        ================================================= */}

        <div className="h-tag">
          "{BIZ.tagline}"
        </div>

        {/* =================================================
            OWNER
        ================================================= */}

        <div className="owner-strip">
          <div className="owner-av">
            AR
          </div>

          <div>
            <div className="owner-name">
              {BIZ.ownerName}
            </div>

            <div className="owner-desig">
              {BIZ.ownerDesignation}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   COMMERCIAL PROFILE SECTIONS
========================================================= */

function CommercialSections() {
  return (
    <>
      {/* =================================================
          BUSINESS OVERVIEW
      ================================================= */}

      <Section
        icon="🏢"
        bg="#dcfce7"
        title="Business Overview"
        sub="Name · Type · Registration"
        delay={0.05}
      >
        <FGrid
          rows={[
            {
              label:
                "Business Name",

              value:
                BIZ.name,
            },

            {
              label:
                "Business Type",

              value:
                BIZ.businessType,

              type:
                "btype",
            },

            {
              label:
                "Founded",

              value:
                BIZ.founded,
            },

            {
              label:
                "GST Number",

              value:
                BIZ.gstNumber,
            },

            {
              label:
                "CIN Number",

              value:
                BIZ.cinNumber,
            },

            {
              label:
                "Employees",

              value:
                BIZ.employeeCount,
            },

            {
              label:
                "Annual Turnover",

              value:
                BIZ.annualTurnover,
            },

            {
              label:
                "Address",

              value:
                BIZ.address,

              full:
                true,
            },
          ]}
        />
      </Section>

      {/* =================================================
          BUSINESS CONTACT
      ================================================= */}

      <Section
        icon="📞"
        bg="#ccfbf1"
        title="Business Contact"
        sub="Phone · Email · Website"
        delay={0.1}
      >
        <FGrid
          rows={[
            {
              label:
                "Contact Phone",

              value:
                BIZ.contactPhone,
            },

            {
              label:
                "Contact Email",

              value:
                BIZ.contactEmail,

              type:
                "link",
            },

            {
              label:
                "Website",

              value:
                BIZ.website,

              type:
                "link",
            },

            {
              label:
                "Owner",

              value:
                BIZ.ownerName,
            },

            {
              label:
                "Designation",

              value:
                BIZ.ownerDesignation,
            },
          ]}
        />
      </Section>

      {/* =================================================
          SOCIAL MEDIA
      ================================================= */}

      <Section
        icon="🌐"
        bg="#dcfce7"
        title="Social Media"
        sub="Business online presence"
        delay={0.2}
      >
        <SocialGrid
          items={
            BIZ.social
          }
        />
      </Section>

      {/* =================================================
          SERVICES
      ================================================= */}

      <Section
        icon="⚙️"
        bg="#ecfccb"
        title="Services & Capabilities"
        sub="What we do best"
        delay={0.15}
      >
        <Skills
          items={
            BIZ.services
          }
          label="Service Strength"
        />
      </Section>

      {/* =================================================
          BUSINESS POSTS
      ================================================= */}

      <Section
        icon="📰"
        bg="#ccfbf1"
        title="Business Posts"
        sub="Recent social media posts"
        delay={0.25}
      >
        <PostGrid
          items={
            BIZ.posts
          }
        />
      </Section>

      {/* =================================================
          BUSINESS BIO
      ================================================= */}

      <Section
        icon="✍️"
        bg="#ecfccb"
        title="Business Bio"
        sub="Our story & mission"
        delay={0.3}
      >
        <div className="bio">
          {BIZ.bio
            .split(
              "\n\n"
            )
            .map(
              (
                paragraph,
                index
              ) => (
                <p
                  key={
                    index
                  }
                >
                  {paragraph}
                </p>
              )
            )}
        </div>

        <div className="bio-wc">
          ~
          {
            BIZ.bio.split(
              " "
            ).length
          }{" "}
          words
        </div>
      </Section>
    </>
  );
}

/* =========================================================
   EXPORTED COMMERCIAL PROFILE TAB
========================================================= */

export default function CommercialProfileTab({
  avRef,
  onAvatarOpen,
}) {
  return (
    <>
      <CommercialProfilePage
        avRef={
          avRef
        }
        onAvatarOpen={
          onAvatarOpen
        }
      />

      <CommercialSections />
    </>
  );
}