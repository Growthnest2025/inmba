import api from "../api/api";

const COMMERCIAL_BASIC_KYC_URL =
  "/commercial-basic-kyc";


/* =========================================================
   SAVE BASIC KYC
========================================================= */

export const saveCommercialBasicKyc =
  async (payload = {}) => {
    const response =
      await api.post(
        COMMERCIAL_BASIC_KYC_URL,
        payload
      );

    return response?.data || {};
  };


/* =========================================================
   GET BY LOGIN ID
========================================================= */

export const getCommercialBasicKycByLoginId =
  async (loginId) => {
    const safeLoginId =
      String(loginId || "").trim();

    if (!safeLoginId) {
      throw new Error(
        "Commercial login ID is required."
      );
    }

    const response =
      await api.get(
        `${COMMERCIAL_BASIC_KYC_URL}/login/${encodeURIComponent(
          safeLoginId
        )}`
      );

    return response?.data || {};
  };


/* =========================================================
   GET BY MOBILE
========================================================= */

export const getCommercialBasicKycByMobile =
  async (mobile) => {
    const safeMobile =
      String(mobile || "").trim();

    if (!safeMobile) {
      throw new Error(
        "Mobile number is required."
      );
    }

    const response =
      await api.get(
        `${COMMERCIAL_BASIC_KYC_URL}/mobile/${encodeURIComponent(
          safeMobile
        )}`
      );

    return response?.data || {};
  };


/* =========================================================
   UPDATE STATUS
========================================================= */

export const updateCommercialBasicKycStatus =
  async (
    id,
    status
  ) => {
    if (!id) {
      throw new Error(
        "Commercial Basic KYC ID is required."
      );
    }

    const response =
      await api.patch(
        `${COMMERCIAL_BASIC_KYC_URL}/${id}/status`,
        {
          status,
        }
      );

    return response?.data || {};
  };


/* =========================================================
   DEFAULT EXPORT
========================================================= */

const commercialBasicKycService = {
  saveCommercialBasicKyc,
  getCommercialBasicKycByLoginId,
  getCommercialBasicKycByMobile,
  updateCommercialBasicKycStatus,
};

export default commercialBasicKycService;