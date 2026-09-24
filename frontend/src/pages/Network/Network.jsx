import React, {
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import "./Network.css";

/* ========================================
   EXACT NETWORK RANK TABLE DATA

   Original Flask:
   templates/network.html
======================================== */

const NETWORK_RANKS = [
  {
    level: "LEVEL 01",
    levelNumber: 1,
    sign: "IN",
    signTheme: "blue",
    title:
      "INDEPENDENT NETWORKER",
    royaltyFrom: "Level 1",

    directNetworkRoyalty: "-",
    indirectNetworkRoyalty: "-",
    directBusinessRoyalty: "12%",
    indirectBusinessRoyalty: "3%",

    paidDirect: "",
    paidIndirect: "",
    nonPaidDirect: "50",
    nonPaidIndirect: "100",
    tnsValue: "50",
    rangeOfTns: "50",
  },

  {
    level: "LEVEL 02",
    levelNumber: 2,
    sign: "ICP",
    signTheme: "blue",
    title:
      "INDEPENDENT CHAMBER PATRON",
    royaltyFrom: "Level 1-2",

    directNetworkRoyalty: "12%",
    indirectNetworkRoyalty: "8%",
    directBusinessRoyalty: "12%",
    indirectBusinessRoyalty: "2%",

    paidDirect: "6",
    paidIndirect: "24",
    nonPaidDirect: "81",
    nonPaidIndirect: "162",
    tnsValue: "135",
    rangeOfTns: "150",
  },

  {
    level: "LEVEL 03",
    levelNumber: 3,
    sign: "ICC",
    signTheme: "blue",
    title:
      "INDEPENDENT CHAMBER COMMITTEE",
    royaltyFrom: "Level 1-3",

    directNetworkRoyalty: "12%",
    indirectNetworkRoyalty: "7%",
    directBusinessRoyalty: "12%",
    indirectBusinessRoyalty: "2%",

    paidDirect: "10",
    paidIndirect: "39",
    nonPaidDirect: "131",
    nonPaidIndirect: "262",
    tnsValue: "218",
    rangeOfTns: "250",
  },

  {
    level: "LEVEL 04",
    levelNumber: 4,
    sign: "DCP",
    signTheme: "blue",
    title:
      "DISTRICT CHAMBER PATRON",
    royaltyFrom: "Level 1-4",

    directNetworkRoyalty: "12%",
    indirectNetworkRoyalty: "6%",
    directBusinessRoyalty: "12%",
    indirectBusinessRoyalty: "2%",

    paidDirect: "16",
    paidIndirect: "63",
    nonPaidDirect: "212",
    nonPaidIndirect: "424",
    tnsValue: "353",
    rangeOfTns: "350",
  },

  {
    level: "LEVEL 05",
    levelNumber: 5,
    sign: "DCC",
    signTheme: "blue",
    title:
      "DISTRICT CHAMBER COMMITTEE",
    royaltyFrom: "Level 1-5",

    directNetworkRoyalty: "12%",
    indirectNetworkRoyalty: "5%",
    directBusinessRoyalty: "12%",
    indirectBusinessRoyalty: "2%",

    paidDirect: "25",
    paidIndirect: "102",
    nonPaidDirect: "343",
    nonPaidIndirect: "685",
    tnsValue: "571",
    rangeOfTns: "600",
  },

  {
    level: "LEVEL 06",
    levelNumber: 6,
    sign: "ZCP",
    signTheme: "blue",
    title:
      "ZONE CHAMBER PATRON",
    royaltyFrom: "Level 1-6",

    directNetworkRoyalty: "12%",
    indirectNetworkRoyalty: "4%",
    directBusinessRoyalty: "12%",
    indirectBusinessRoyalty: "2%",

    paidDirect: "41",
    paidIndirect: "165",
    nonPaidDirect: "555",
    nonPaidIndirect: "1,109",
    tnsValue: "925",
    rangeOfTns: "1000",
  },

  {
    level: "LEVEL 07",
    levelNumber: 7,
    sign: "ZCC",
    signTheme: "orange",
    title:
      "ZONE CHAMBER COMMITTEE",
    royaltyFrom: "Level 1-7",

    directNetworkRoyalty: "12%",
    indirectNetworkRoyalty: "5%",
    directBusinessRoyalty: "12%",
    indirectBusinessRoyalty: "3%",

    paidDirect: "67",
    paidIndirect: "266",
    nonPaidDirect: "897",
    nonPaidIndirect: "1,795",
    tnsValue: "1,496",
    rangeOfTns: "1500",
  },

  {
    level: "LEVEL 08",
    levelNumber: 8,
    sign: "SCP",
    signTheme: "red",
    title:
      "STATE CHAMBER PATRON",
    royaltyFrom: "Level 1-8",

    directNetworkRoyalty: "12%",
    indirectNetworkRoyalty: "5%",
    directBusinessRoyalty: "12%",
    indirectBusinessRoyalty: "3%",

    paidDirect: "108",
    paidIndirect: "431",
    nonPaidDirect: "1,452",
    nonPaidIndirect: "2,904",
    tnsValue: "2,421",
    rangeOfTns: "2500",
  },

  {
    level: "LEVEL 09",
    levelNumber: 9,
    sign: "SCC",
    signTheme: "red",
    title:
      "STATE CHAMBER COMMITTEE",
    royaltyFrom: "Level 1-9",

    directNetworkRoyalty: "12%",
    indirectNetworkRoyalty: "4%",
    directBusinessRoyalty: "12%",
    indirectBusinessRoyalty: "4%",

    paidDirect: "174",
    paidIndirect: "697",
    nonPaidDirect: "2,349",
    nonPaidIndirect: "4,698",
    tnsValue: "3,917",
    rangeOfTns: "5000",
  },

  {
    level: "LEVEL 10",
    levelNumber: 10,
    sign: "NCP",
    signTheme: "red",
    title:
      "NATIONAL CHAMBER PATRON",
    royaltyFrom: "Level 1-10",

    directNetworkRoyalty: "12%",
    indirectNetworkRoyalty: "4%",
    directBusinessRoyalty: "12%",
    indirectBusinessRoyalty: "4%",

    paidDirect: "282",
    paidIndirect: "1,128",
    nonPaidDirect: "3,801",
    nonPaidIndirect: "7,602",
    tnsValue: "6,338",
    rangeOfTns: "7500",
  },

  {
    level: "LEVEL 11",
    levelNumber: 11,
    sign: "NCC",
    signTheme: "red",
    title:
      "NATIONAL CHAMBER COMMITTEE",
    royaltyFrom: "Level 1-11",

    directNetworkRoyalty: "12%",
    indirectNetworkRoyalty: "3%",
    directBusinessRoyalty: "12%",
    indirectBusinessRoyalty: "7%",

    paidDirect: "456",
    paidIndirect: "1,824",
    nonPaidDirect: "6,150",
    nonPaidIndirect: "12,300",
    tnsValue: "10,255",
    rangeOfTns: "10000",
  },

  {
    level: "LEVEL 12",
    levelNumber: 12,
    sign: "CCP",
    signTheme: "red",
    title:
      "CONTINENTAL CHAMBER PATRON",
    royaltyFrom: "Level 1-12",

    directNetworkRoyalty: "12%",
    indirectNetworkRoyalty: "3%",
    directBusinessRoyalty: "12%",
    indirectBusinessRoyalty: "5%",

    paidDirect: "738",
    paidIndirect: "2,952",
    nonPaidDirect: "9,951",
    nonPaidIndirect: "19,902",
    tnsValue: "16,593",
    rangeOfTns: "20000",
  },

  {
    level: "LEVEL 13",
    levelNumber: 13,
    sign: "CCC",
    signTheme: "red",
    title:
      "CONTINENTAL CHAMBER COMMITTEE",
    royaltyFrom: "Level 1-13",

    directNetworkRoyalty: "12%",
    indirectNetworkRoyalty: "3%",
    directBusinessRoyalty: "12%",
    indirectBusinessRoyalty: "6%",

    paidDirect: "1,194",
    paidIndirect: "4,777",
    nonPaidDirect: "16,101",
    nonPaidIndirect: "32,203",
    tnsValue: "26,849",
    rangeOfTns: "30000",
  },

  {
    level: "LEVEL 14",
    levelNumber: 14,
    sign: "INCP",
    signTheme: "red",
    title:
      "INTERNATIONAL CHAMBER PATRON",
    royaltyFrom: "Level 1-14",

    directNetworkRoyalty: "12%",
    indirectNetworkRoyalty: "2%",
    directBusinessRoyalty: "12%",
    indirectBusinessRoyalty: "7%",

    paidDirect: "1,932",
    paidIndirect: "7,729",
    nonPaidDirect: "26,053",
    nonPaidIndirect: "52,106",
    tnsValue: "43,442",
    rangeOfTns: "50000",
  },

  {
    level: "LEVEL 15",
    levelNumber: 15,
    sign: "INCC",
    signTheme: "red",
    title:
      "INTERNATIONAL CHAMBER COMMITTEE",
    royaltyFrom: "Level 1-15",

    directNetworkRoyalty: "12%",
    indirectNetworkRoyalty: "1%",
    directBusinessRoyalty: "12%",
    indirectBusinessRoyalty: "10%",

    paidDirect: "3,126",
    paidIndirect: "12,505",
    nonPaidDirect: "42,155",
    nonPaidIndirect: "84,309",
    tnsValue: "70,292",
    rangeOfTns: "75000",
  },

  {
    level: "LEVEL 16",
    levelNumber: 16,
    sign: "IPS",
    signTheme: "red",
    title:
      "INMBA PATRON SENATE",
    royaltyFrom: "Level 1-16",

    directNetworkRoyalty: "12%",
    indirectNetworkRoyalty: "1%",
    directBusinessRoyalty: "12%",
    indirectBusinessRoyalty: "12%",

    paidDirect: "5,059",
    paidIndirect: "20,234",
    nonPaidDirect: "68,208",
    nonPaidIndirect: "136,416",
    tnsValue: "113,735",
    rangeOfTns: "100000",
  },
];

/* ========================================
   TABLE CELL
======================================== */

function TableValue({
  value,
  highlight = false,
}) {
  const displayValue =
    String(
      value ?? ""
    ).trim() || "—";

  return (
    <td
      className={
        highlight
          ? "inmba-network-value-highlight"
          : ""
      }
    >
      {displayValue}
    </td>
  );
}

/* ========================================
   NETWORK PAGE

   Public static page.

   No API request.
======================================== */

export default function Network() {
  const [
    searchText,
    setSearchText,
  ] =
    useState("");

  const [
    selectedGroup,
    setSelectedGroup,
  ] =
    useState("all");

  /* ========================================
     FILTERED RANKS
  ======================================== */

  const filteredRanks =
    useMemo(
      () => {
        const normalizedSearch =
          searchText
            .trim()
            .toLowerCase();

        return NETWORK_RANKS.filter(
          (
            rank
          ) => {
            const matchesSearch =
              !normalizedSearch ||
              rank.level
                .toLowerCase()
                .includes(
                  normalizedSearch
                ) ||
              rank.sign
                .toLowerCase()
                .includes(
                  normalizedSearch
                ) ||
              rank.title
                .toLowerCase()
                .includes(
                  normalizedSearch
                );

            let matchesGroup =
              true;

            if (
              selectedGroup ===
              "entry"
            ) {
              matchesGroup =
                rank.levelNumber <=
                6;
            }

            if (
              selectedGroup ===
              "zone-state"
            ) {
              matchesGroup =
                rank.levelNumber >=
                  7 &&
                rank.levelNumber <=
                  9;
            }

            if (
              selectedGroup ===
              "national"
            ) {
              matchesGroup =
                rank.levelNumber >=
                  10 &&
                rank.levelNumber <=
                  11;
            }

            if (
              selectedGroup ===
              "international"
            ) {
              matchesGroup =
                rank.levelNumber >=
                12;
            }

            return (
              matchesSearch &&
              matchesGroup
            );
          }
        );
      },
      [
        searchText,
        selectedGroup,
      ]
    );

  /* ========================================
     CLEAR FILTERS
  ======================================== */

  const clearFilters =
    () => {
      setSearchText("");
      setSelectedGroup(
        "all"
      );
    };

  return (
    <main className="inmba-network-page">
      {/* =================================
          HERO
      ================================= */}

      <section className="inmba-network-hero">
        <div className="inmba-network-container inmba-network-hero-layout">
          <div className="inmba-network-hero-content">
            <p>
              INMBA Network Structure
            </p>

            <h1>
              Network Rank & TNS Table
            </h1>

            <span>
              Explore the complete INMBA network rank structure,
              royalty percentages, member scores and TNS
              requirements from Level 01 to Level 16.
            </span>

            <div className="inmba-network-hero-actions">
              <a href="#network-rank-table">
                View Rank Table

                <i
                  className="fas fa-arrow-down"
                  aria-hidden="true"
                ></i>
              </a>

              <Link to="/membership-type">
                Become a Member

                <i
                  className="fas fa-arrow-right"
                  aria-hidden="true"
                ></i>
              </Link>
            </div>
          </div>

          <div className="inmba-network-hero-visual">
            <div className="inmba-network-main-circle">
              <span>
                INMBA
              </span>

              <small>
                Network
              </small>
            </div>

            <div className="inmba-network-orbit inmba-network-orbit-one">
              <i
                className="fas fa-user"
                aria-hidden="true"
              ></i>
            </div>

            <div className="inmba-network-orbit inmba-network-orbit-two">
              <i
                className="fas fa-users"
                aria-hidden="true"
              ></i>
            </div>

            <div className="inmba-network-orbit inmba-network-orbit-three">
              <i
                className="fas fa-globe"
                aria-hidden="true"
              ></i>
            </div>

            <div className="inmba-network-orbit inmba-network-orbit-four">
              <i
                className="fas fa-crown"
                aria-hidden="true"
              ></i>
            </div>
          </div>
        </div>
      </section>

      <div className="inmba-network-container">
        {/* =================================
            SUMMARY
        ================================= */}

        <section className="inmba-network-summary">
          <article>
            <span>
              <i
                className="fas fa-layer-group"
                aria-hidden="true"
              ></i>
            </span>

            <div>
              <strong>
                16
              </strong>

              <small>
                Network Levels
              </small>
            </div>
          </article>

          <article>
            <span>
              <i
                className="fas fa-percent"
                aria-hidden="true"
              ></i>
            </span>

            <div>
              <strong>
                12%
              </strong>

              <small>
                Direct Royalty
              </small>
            </div>
          </article>

          <article>
            <span>
              <i
                className="fas fa-ranking-star"
                aria-hidden="true"
              ></i>
            </span>

            <div>
              <strong>
                IPS
              </strong>

              <small>
                Highest Rank
              </small>
            </div>
          </article>

          <article>
            <span>
              <i
                className="fas fa-chart-line"
                aria-hidden="true"
              ></i>
            </span>

            <div>
              <strong>
                100,000
              </strong>

              <small>
                Maximum TNS Range
              </small>
            </div>
          </article>
        </section>

        {/* =================================
            INTRODUCTION
        ================================= */}

        <section className="inmba-network-introduction">
          <div>
            <p>
              Rank Progression
            </p>

            <h2>
              Complete Network Structure
            </h2>

            <span>
              Search by rank title, level or rank sign. Use the
              category filters to view specific rank groups.
            </span>
          </div>

          <div className="inmba-network-legend">
            <span>
              <i className="inmba-network-legend-blue"></i>

              Initial Levels
            </span>

            <span>
              <i className="inmba-network-legend-orange"></i>

              Zone Level
            </span>

            <span>
              <i className="inmba-network-legend-red"></i>

              Senior Levels
            </span>
          </div>
        </section>

        {/* =================================
            FILTERS
        ================================= */}

        <section className="inmba-network-filters">
          <div className="inmba-network-search">
            <i
              className="fas fa-magnifying-glass"
              aria-hidden="true"
            ></i>

            <input
              type="search"
              value={
                searchText
              }
              onChange={(
                event
              ) =>
                setSearchText(
                  event.target.value
                )
              }
              placeholder="Search level, sign or rank title"
              aria-label="Search network ranks"
            />

            {searchText && (
              <button
                type="button"
                onClick={() =>
                  setSearchText("")
                }
                aria-label="Clear search"
              >
                <i
                  className="fas fa-xmark"
                  aria-hidden="true"
                ></i>
              </button>
            )}
          </div>

          <div className="inmba-network-filter-buttons">
            <button
              type="button"
              className={
                selectedGroup ===
                "all"
                  ? "inmba-network-filter-active"
                  : ""
              }
              onClick={() =>
                setSelectedGroup(
                  "all"
                )
              }
            >
              All Levels
            </button>

            <button
              type="button"
              className={
                selectedGroup ===
                "entry"
                  ? "inmba-network-filter-active"
                  : ""
              }
              onClick={() =>
                setSelectedGroup(
                  "entry"
                )
              }
            >
              Levels 01–06
            </button>

            <button
              type="button"
              className={
                selectedGroup ===
                "zone-state"
                  ? "inmba-network-filter-active"
                  : ""
              }
              onClick={() =>
                setSelectedGroup(
                  "zone-state"
                )
              }
            >
              Zone & State
            </button>

            <button
              type="button"
              className={
                selectedGroup ===
                "national"
                  ? "inmba-network-filter-active"
                  : ""
              }
              onClick={() =>
                setSelectedGroup(
                  "national"
                )
              }
            >
              National
            </button>

            <button
              type="button"
              className={
                selectedGroup ===
                "international"
                  ? "inmba-network-filter-active"
                  : ""
              }
              onClick={() =>
                setSelectedGroup(
                  "international"
                )
              }
            >
              International
            </button>
          </div>
        </section>

        {/* =================================
            RESULT COUNT
        ================================= */}

        <div className="inmba-network-result-count">
          <span>
            Showing{" "}
            <strong>
              {
                filteredRanks.length
              }
            </strong>{" "}
            of{" "}
            <strong>
              {
                NETWORK_RANKS.length
              }
            </strong>{" "}
            ranks
          </span>

          {(searchText ||
            selectedGroup !==
              "all") && (
            <button
              type="button"
              onClick={
                clearFilters
              }
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* =================================
            RANK TABLE
        ================================= */}

        <section
          id="network-rank-table"
          className="inmba-network-table-card"
        >
          <header>
            <div>
              <span>
                <i
                  className="fas fa-table"
                  aria-hidden="true"
                ></i>
              </span>

              <div>
                <p>
                  Official Structure
                </p>

                <h2>
                  INMBA Rank Table
                </h2>
              </div>
            </div>

            <small>
              Swipe horizontally on mobile
            </small>
          </header>

          <div className="inmba-network-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th rowSpan={2}>
                    Levels
                  </th>

                  <th rowSpan={2}>
                    Sign
                  </th>

                  <th
                    rowSpan={2}
                    className="inmba-network-title-column"
                  >
                    Title of Rank
                  </th>

                  <th rowSpan={2}>
                    Royalty From
                  </th>

                  <th colSpan={4}>
                    Percentage
                  </th>

                  <th colSpan={5}>
                    TNS Score
                  </th>

                  <th rowSpan={2}>
                    Range of TNS
                  </th>
                </tr>

                <tr>
                  <th>
                    Direct Network Royalty
                  </th>

                  <th>
                    IN Direct Network Royalty
                  </th>

                  <th>
                    Direct Business Royalty
                  </th>

                  <th>
                    IN Direct Business Royalty
                  </th>

                  <th>
                    Paid Direct
                  </th>

                  <th>
                    Paid IN-Direct
                  </th>

                  <th>
                    Non Paid Direct Member
                  </th>

                  <th>
                    Non Paid IN-Direct Member
                  </th>

                  <th>
                    TNS Value
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredRanks.map(
                  (
                    rank
                  ) => (
                    <tr
                      key={
                        rank.level
                      }
                    >
                      <td className="inmba-network-level-cell">
                        <span>
                          {
                            rank.level
                          }
                        </span>
                      </td>

                      <td>
                        <strong
                          className={`inmba-network-rank-sign inmba-network-rank-sign-${rank.signTheme}`}
                        >
                          {rank.sign}
                        </strong>
                      </td>

                      <td className="inmba-network-rank-title">
                        {rank.title}
                      </td>

                      <td>
                        {
                          rank.royaltyFrom
                        }
                      </td>

                      <TableValue
                        value={
                          rank.directNetworkRoyalty
                        }
                      />

                      <TableValue
                        value={
                          rank.indirectNetworkRoyalty
                        }
                        highlight={
                          rank.levelNumber >=
                            2 &&
                          rank.levelNumber <=
                            6
                        }
                      />

                      <TableValue
                        value={
                          rank.directBusinessRoyalty
                        }
                      />

                      <TableValue
                        value={
                          rank.indirectBusinessRoyalty
                        }
                      />

                      <TableValue
                        value={
                          rank.paidDirect
                        }
                      />

                      <TableValue
                        value={
                          rank.paidIndirect
                        }
                      />

                      <TableValue
                        value={
                          rank.nonPaidDirect
                        }
                      />

                      <TableValue
                        value={
                          rank.nonPaidIndirect
                        }
                      />

                      <TableValue
                        value={
                          rank.tnsValue
                        }
                      />

                      <td className="inmba-network-range-cell">
                        {
                          rank.rangeOfTns
                        }
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>

            {filteredRanks.length ===
              0 && (
              <div className="inmba-network-empty">
                <span>
                  <i
                    className="fas fa-magnifying-glass"
                    aria-hidden="true"
                  ></i>
                </span>

                <h3>
                  No Rank Found
                </h3>

                <p>
                  Change the search text or clear the selected
                  category filter.
                </p>

                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* =================================
            NOTES
        ================================= */}

        <section className="inmba-network-notes">
          <span>
            <i
              className="fas fa-circle-info"
              aria-hidden="true"
            ></i>
          </span>

          <div>
            <h3>
              Understanding the Table
            </h3>

            <p>
              Rank progression is displayed using network levels,
              royalty percentages and the corresponding TNS score
              values. Empty source values are displayed as a dash.
            </p>
          </div>
        </section>

        {/* =================================
            CTA
        ================================= */}

        <section className="inmba-network-cta">
          <div>
            <p>
              Start Your Network Journey
            </p>

            <h2>
              Expand Your Network; Expand Your Net Worth
            </h2>

            <span>
              Join INMBA and begin building professional
              relationships through the membership network.
            </span>
          </div>

          <Link to="/membership-type">
            View Membership Types

            <i
              className="fas fa-arrow-right"
              aria-hidden="true"
            ></i>
          </Link>
        </section>
      </div>
    </main>
  );
}