import React from "react";

import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

/* =========================
   LAYOUTS
========================= */

import PublicLayout from "../layouts/PublicLayout";
import MemberLayout from "../layouts/MemberLayout";
import AdminLayout from "../layouts/AdminLayout";

/* =========================
   ROUTE GUARDS
========================= */

import GuestRoute from "./GuestRoute";
import ProtectedRoute from "./ProtectedRoute";
import AdminProtectedRoute from "./AdminProtectedRoute";

/* =========================
   PUBLIC WEBSITE PAGES
========================= */

import Home from "../pages/Home/Home";
import About from "../pages/About/About";
import Programs from "../pages/Programs/Programs";
import Events from "../pages/Events/Events";
import Contact from "../pages/Contact/Contact";
import Organization from "../pages/Organization/Organization";
import Commercial from "../pages/Commercial/Commercial";
import Foundation from "../pages/Foundation/Foundation";

/* =========================
   REGISTRATION PAGES
========================= */

import MembershipType
  from "../pages/Registration/MembershipType/MembershipType";

import MembershipRegistration
  from "../pages/Registration/MembershipRegistration/MembershipRegistration";

import KycSubmitted
  from "../pages/Registration/KycSubmitted/KycSubmitted";

import StudentRegistration
  from "../pages/Registration/StudentRegistration/StudentRegistration";

import ProfessionalRegistration
  from "../pages/Registration/ProfessionalRegistration/ProfessionalRegistration";

import OrganizationMemberRegistration
  from "../pages/Registration/OrganizationMemberRegistration/OrganizationMemberRegistration";

import CommercialMembership
  from "../pages/Registration/CommercialMembership/CommercialMembership";

/* =========================
   PUBLIC PROFILE
========================= */

import PremiumProfile
  from "../pages/publicProfile/PremiumProfile/PremiumProfile";

import CivilianPublicProfile
  from "../pages/publicProfile/CivilianPublicProfile/CivilianPublicProfile";

import CivilianPublicProfileOwner
  from "../pages/publicProfile/CivilianPublicProfile/CivilianPublicProfileOwner";

import PublicProfileAliasRedirect
  from "../components/routes/PublicProfileAliasRedirect";

/* =========================
   MEMBER AUTH
========================= */

import Login
  from "../pages/Auth/Login/Login";

import ProfessionalLogin
  from "../pages/Login/ProfessionalLogin";

import ForgotPassword
  from "../pages/Auth/ForgotPassword/ForgotPassword";

import VerifyOtp
  from "../pages/Auth/VerifyOtp/VerifyOtp";

import ResetPassword
  from "../pages/Auth/ResetPassword/ResetPassword";

import Policy
  from "../pages/Auth/Policy/Policy";

/* =========================
   MEMBER PAGES
========================= */

import Dashboard
  from "../pages/Dashboard/Dashboard/Dashboard";

import Profile
  from "../pages/Profile/Profile/Profile";

import EditProfile
  from "../pages/Profile/EditProfile/EditProfile";

import QRCode
  from "../pages/QRCode/QRCode/QRCode";

import Payment
  from "../pages/Payment/Payment/Payment";

import BankDetails
  from "../pages/member/BankDetails/BankDetails";

/* =========================
   MEMBER KYC
========================= */

import LegalEntity
  from "../pages/Kyc/LegalEntity/LegalEntity";

import PanDetails
  from "../pages/Kyc/PanDetails/PanDetails";

import ProfilePicture
  from "../pages/Kyc/ProfilePicture/ProfilePicture";

import CivilianAcknowledgement
  from "../pages/Kyc/CivilianAcknowledgement/CivilianAcknowledgement";

import CivilianKyc
  from "../pages/CivilianKyc/CivilianKyc";

import CivilianMembershipPlan
  from "../pages/CivilianMembershipPlan/CivilianMembershipPlan";

import CivilianReview
  from "../pages/CivilianReview/CivilianReview";

import Acknowledgement
  from "../pages/Kyc/Acknowledgement/Acknowledgement";

/* =========================
   PROFESSIONAL FLOW
========================= */

import ProfessionalKyc
  from "../pages/professional/ProfessionalKyc";

import ProfessionalMembership
  from "../pages/ProfessionalMembership/ProfessionalMembership";


import ProfessionalRegistrationSuccess
  from "../pages/Registration/ProfessionalRegistration/ProfessionalRegistrationSuccess";
import ProfessionalReview
  from "../pages/ProfessionalReview/ProfessionalReview";

import ProfessionalPayment
  from "../pages/ProfessionalPayment/ProfessionalPayment";

import ProfessionalDashboard
  from "../pages/ProfessionalDashboard/ProfessionalDashboard";

import ProfessionalProfile
  from "../pages/ProfessionalProfile/ProfessionalProfile";

import ProfessionalPublicProfileOwner
  from "../pages/publicProfile/ProfessionalPublicProfile/ProfessionalPublicProfileOwner";

/* =========================
   NETWORK
========================= */

import Network
  from "../pages/Network/Network";

import DirectNetwork
  from "../pages/Network/DirectNetwork/DirectNetwork";

/* =========================
   ROYALTY
========================= */

import RoyaltyRewards
  from "../pages/Rewards/RoyaltyRewards/RoyaltyRewards";

/* =========================
   CHATBOT
========================= */

import ChatBot
  from "../pages/ChatBot/ChatBot";

/* =========================
   ADMIN
========================= */

import AdminLogin
  from "../pages/Admin/AdminLogin/AdminLogin";

import AdminDashboard
  from "../pages/Admin/AdminDashboard/AdminDashboard";

import AdminMemberDetails
  from "../pages/Admin/AdminMemberDetails/AdminMemberDetails";

import AdminMemberEdit
  from "../pages/Admin/AdminMemberEdit/AdminMemberEdit";

import DeletedUsers
  from "../pages/Admin/DeletedUsers/DeletedUsers";

import AdminEvents
  from "../pages/Admin/AdminEvents/AdminEvents";

import DeletedUsersBackup
  from "../pages/Admin/DeletedUsersBackup/DeletedUsersBackup";

import AllUsersBackup
  from "../pages/Admin/AllUsersBackup/AllUsersBackup";

/* =========================
   LOGIN SELECTION
========================= */

import LoginSelection
  from "../pages/LoginSelection/LoginSelection";

import CommercialLogin
  from "../pages/Login/CommercialLogin";

/* =========================================================
   COMMERCIAL FLOW

   IMPORTANT:

   OLD:
   CommercialBasicKyc only

   NEW:
   Everything after Basic KYC comes from
   CommercialRegistration/components
========================================================= */

/* OLD BASIC KYC */

import CommercialBasicKyc
  from "../pages/CommercialBasicKyc/CommercialBasicKyc";

/* NEW COMMERCIAL COMPONENTS */

import CommercialMembershipPlan
  from "../pages/CommercialRegistration/components/CommercialMembershipPlan";

import CommercialPayment
  from "../pages/CommercialRegistration/components/CommercialPayment";

import CommercialProfileUpgrade
  from "../pages/CommercialRegistration/components/CommercialProfileUpgrade";

import CommercialReview
  from "../pages/CommercialRegistration/components/CommercialReview";

import CommercialDashboard
  from "../pages/CommercialRegistration/components/CommercialDashboard";

import CommercialFullProfile
  from "../pages/CommercialRegistration/components/CommercialFullProfile";

import CommercialProfileEdit
  from "../pages/CommercialRegistration/components/CommercialProfileEdit";

import CommercialPublicProfileEdit
  from "../pages/CommercialRegistration/components/CommercialPublicProfileEdit";

import CommercialPublicProfile
  from "../pages/CommercialRegistration/components/CommercialPublicProfile";

import CommercialQrPage
  from "../pages/CommercialRegistration/components/CommercialQrPage";

  
/* =========================================================
   APPLICATION ROUTES
========================================================= */

export default function AppRoutes() {
  return (
    <Routes>

      {/* ===================================================
          COMMERCIAL BASIC KYC
          OLD FILE - KEEP
      =================================================== */}

      <Route
        path="/commercial-basic-kyc"
        element={
          <CommercialBasicKyc />
        }
      />

      {/* ===================================================
          PUBLIC MEMBER PROFILES - FULL SCREEN

          These routes intentionally stay outside PublicLayout
          so Navbar and Footer are not rendered.
      =================================================== */}

      <Route
        path="/commercial/public-profile/:loginId"
        element={
          <CommercialPublicProfile />
        }
      />

      <Route
        path="/public-profile/:loginId"
        element={
          <CivilianPublicProfile
            publicViewOnly={true}
          />
        }
      />

      <Route
        path="/profile-view/:loginId"
        element={
          <CivilianPublicProfile
            publicViewOnly={true}
          />
        }
      />

      <Route
        path="/user-profile/:loginId"
        element={
          <PremiumProfile />
        }
      />

      <Route
        path="/PremiumProfile/:loginId"
        element={
          <PublicProfileAliasRedirect />
        }
      />

      <Route
        path="/commercial/public-profile-edit"
        element={
          <CommercialPublicProfileEdit />
        }
      />

      {/* ===================================================
          PUBLIC WEBSITE
      =================================================== */}

      <Route
        element={
          <PublicLayout />
        }
      >

        <Route
          path="/"
          element={
            <Home />
          }
        />

        <Route
          path="/about"
          element={
            <About />
          }
        />

        <Route
          path="/programs"
          element={
            <Programs />
          }
        />

        <Route
          path="/events"
          element={
            <Events />
          }
        />

        <Route
          path="/contact"
          element={
            <Contact />
          }
        />

        <Route
          path="/organization"
          element={
            <Organization />
          }
        />

        <Route
          path="/commercial"
          element={
            <Commercial />
          }
        />

        <Route
          path="/foundation"
          element={
            <Foundation />
          }
        />

        {/* ===============================================
            MEMBERSHIP TYPE
        =============================================== */}

        <Route
          path="/membership-type"
          element={
            <MembershipType />
          }
        />

        <Route
          path="/membership/type"
          element={
            <MembershipType />
          }
        />

        {/* ===============================================
            CIVILIAN REGISTRATION
        =============================================== */}

        <Route
          path="/membership"
          element={
            <MembershipRegistration />
          }
        />

        <Route
          path="/membership/civilian"
          element={
            <MembershipRegistration />
          }
        />

        {/* ===============================================
            STUDENT
        =============================================== */}

        <Route
          path="/student"
          element={
            <StudentRegistration />
          }
        />

        {/* ===============================================
            ORGANIZATION MEMBER
        =============================================== */}

        <Route
          path="/organization_member"
          element={
            <OrganizationMemberRegistration />
          }
        />

        {/* =================================================
            COMMERCIAL ENTRY
        ================================================= */}

        <Route
  path="/membership/commercial"
  element={
    <CommercialBasicKyc />
  }
/>

<Route
  path="/commercial-registration"
  element={
    <CommercialBasicKyc />
  }
/>

<Route
  path="/commercial-membership"
  element={
    <CommercialBasicKyc />
  }
/>
        {/* =================================================
            NEW COMMERCIAL MEMBERSHIP PLAN
        ================================================= */}

        <Route
          path="/commercial/membership-plan"
          element={
            <CommercialMembershipPlan />
          }
        />

        {/* OLD URL COMPATIBILITY */}

        <Route
          path="/commercial-membership-plan"
          element={
            <Navigate
              to="/commercial/membership-plan"
              replace
            />
          }
        />

        {/* =================================================
            COMMERCIAL ₹300 / FINAL PAYMENT

            ₹300:
            Plan -> Payment

            ₹1500:
            Full KYC -> Review -> Payment
        ================================================= */}

        <Route
          path="/commercial/payment"
          element={
            <CommercialPayment />
          }
        />

        {/* =================================================
            ₹1500 FULL COMMERCIAL KYC
        ================================================= */}

        <Route
          path="/commercial/profile-upgrade"
          element={
            <CommercialProfileUpgrade />
          }
        />

        {/* =================================================
            ₹1500 FULL KYC REVIEW
        ================================================= */}

        <Route
          path="/commercial/profile-upgrade/review"
          element={
            <CommercialReview />
          }
        />

        {/* REVIEW ALIAS */}

        <Route
          path="/commercial/review"
          element={
            <Navigate
              to="/commercial/profile-upgrade/review"
              replace
            />
          }
        />

        {/* =================================================
            COMMERCIAL DASHBOARD
        ================================================= */}

        <Route
          path="/commercial/dashboard"
          element={
            <CommercialDashboard />
          }
        />

        {/* =================================================
            COMMERCIAL FULL PROFILE
        ================================================= */}

        <Route
          path="/commercial/full-profile"
          element={
            <CommercialFullProfile />
          }
        />

        {/* =================================================
            COMMERCIAL PROFILE EDIT
        ================================================= */}

        <Route
          path="/commercial/profile-edit"
          element={
            <CommercialProfileEdit />
          }
        />

        {/* =================================================
            COMMERCIAL QR
        ================================================= */}

        <Route
          path="/commercial/qr"
          element={
            <CommercialQrPage />
          }
        />

        {/* =================================================
            OLD PAYMENT SUCCESS URL

            New CommercialRegistration flow does not use
            old CommercialPaymentSuccess component.

            Keep URL compatibility by sending user to
            Commercial Dashboard.
        ================================================= */}

        <Route
          path="/commercial/payment-success"
          element={
            <Navigate
              to="/commercial/dashboard"
              replace
            />
          }
        />

        {/* ===============================================
            SUCCESS
        =============================================== */}

        <Route
          path="/success"
          element={
            <KycSubmitted />
          }
        />

        {/* ===============================================
            NETWORK / POLICY / CHATBOT
        =============================================== */}

        <Route
          path="/policy"
          element={
            <Policy />
          }
        />

        <Route
          path="/network"
          element={
            <Network />
          }
        />

        <Route
          path="/chatbot"
          element={
            <ChatBot />
          }
        />

        {/* ===============================================
            PASSWORD ROUTES
        =============================================== */}

        <Route
          element={
            <GuestRoute />
          }
        >

          <Route
            path="/forgot_password"
            element={
              <ForgotPassword />
            }
          />

          <Route
            path="/forgot-password"
            element={
              <Navigate
                to="/forgot_password"
                replace
              />
            }
          />

          <Route
            path="/verify_otp"
            element={
              <VerifyOtp />
            }
          />

          <Route
            path="/verify-otp"
            element={
              <Navigate
                to="/verify_otp"
                replace
              />
            }
          />

          <Route
            path="/reset_password"
            element={
              <ResetPassword />
            }
          />

          <Route
            path="/reset-password"
            element={
              <Navigate
                to="/reset_password"
                replace
              />
            }
          />

        </Route>

        {/* ===============================================
            ADMIN LOGIN
        =============================================== */}

        <Route
          path="/admin_login"
          element={
            <AdminLogin />
          }
        />

        {/* ===============================================
            ADMIN PROTECTED
        =============================================== */}

        <Route
          element={
            <AdminProtectedRoute />
          }
        >

          <Route
            element={
              <AdminLayout />
            }
          >

            <Route
              path="/admin"
              element={
                <AdminDashboard />
              }
            />

            <Route
              path="/admin/member/:id"
              element={
                <AdminMemberDetails />
              }
            />

            <Route
              path="/admin/member/:id/edit"
              element={
                <AdminMemberEdit />
              }
            />

            <Route
              path="/deleted_users"
              element={
                <DeletedUsers />
              }
            />

            <Route
              path="/admin/events"
              element={
                <AdminEvents />
              }
            />

            <Route
              path="/deleted_users_backup"
              element={
                <DeletedUsersBackup />
              }
            />

            <Route
              path="/all_users_backup"
              element={
                <AllUsersBackup />
              }
            />

          </Route>

        </Route>

      </Route>

      {/* ===================================================
          LOGIN SELECTION
      =================================================== */}

      <Route
        path="/login"
        element={
          <LoginSelection />
        }
      />

      {/* ===================================================
          CIVILIAN LOGIN
      =================================================== */}

      <Route
        path="/login/civilian"
        element={
          <Login />
        }
      />

      {/* ===================================================
          PROFESSIONAL LOGIN
      =================================================== */}

      <Route
        path="/login/professional"
        element={
          <ProfessionalLogin />
        }
      />

      <Route
        path="/professional-login"
        element={
          <ProfessionalLogin />
        }
      />

      {/* ===================================================
          COMMERCIAL LOGIN
      =================================================== */}

      <Route
        path="/login/commercial"
        element={
          <CommercialLogin />
        }
      />

      {/* ===================================================
          PROFESSIONAL REGISTRATION
      =================================================== */}

      <Route
        path="/professional"
        element={
          <ProfessionalRegistration />
        }
      />

      <Route
        path="/professional-registration-success"
        element={
          <ProfessionalRegistrationSuccess />
        }
      />

      {/* ===================================================
          PROFESSIONAL DASHBOARD
      =================================================== */}

      <Route
        path="/professional-dashboard"
        element={
          <ProfessionalDashboard />
        }
      />

      {/* ===================================================
          PROFESSIONAL PROFILE
      =================================================== */}

      <Route
        path="/professional-profile"
        element={
          <ProfessionalProfile />
        }
      />

      {/* ===================================================
          PROFESSIONAL PUBLIC PROFILE OWNER
      =================================================== */}

      <Route
        path="/professional-public-profile"
        element={
          <ProfessionalPublicProfileOwner />
        }
      />

      {/* ===================================================
          PROTECTED FULL SCREEN FLOW
      =================================================== */}

      <Route
        element={
          <ProtectedRoute />
        }
      >

        {/* ===============================================
            PROFESSIONAL KYC
            DO NOT CHANGE
        =============================================== */}

        <Route
          path="/professional-kyc"
          element={
            <ProfessionalKyc />
          }
        />

        <Route
          path="/professional-kyc/:token"
          element={
            <ProfessionalKyc />
          }
        />

        {/* ===============================================
            PROFESSIONAL REVIEW
        =============================================== */}

        <Route
          path="/professional-review"
          element={
            <ProfessionalReview />
          }
        />

        {/* ===============================================
            PROFESSIONAL MEMBERSHIP
        =============================================== */}

        <Route
          path="/professional-membership"
          element={
            <ProfessionalMembership />
          }
        />

        {/* ===============================================
            ACKNOWLEDGEMENT
        =============================================== */}

        <Route
          path="/acknowledgement/:token"
          element={
            <Acknowledgement />
          }
        />

        {/* ===============================================
            CIVILIAN MEMBERSHIP PLAN
        =============================================== */}

        <Route
          path="/civilian-membership-plan"
          element={
            <CivilianMembershipPlan />
          }
        />

        {/* ===============================================
            CIVILIAN REVIEW
        =============================================== */}

        <Route
          path="/civilian-review"
          element={
            <CivilianReview />
          }
        />

        {/* ===============================================
            CIVILIAN FULL KYC
        =============================================== */}

        <Route
          path="/civilian-kyc"
          element={
            <CivilianKyc />
          }
        />

        <Route
          path="/civilian-kyc/:token"
          element={
            <CivilianKyc />
          }
        />

        {/* ===============================================
            CIVILIAN DASHBOARD
        =============================================== */}

        <Route
          path="/dashboard"
          element={
            <Dashboard />
          }
        />

        {/* ===============================================
            CIVILIAN PUBLIC PROFILE
            OWNER VIEW
        =============================================== */}

        <Route
          path="/civilian-public-profile"
          element={
            <CivilianPublicProfileOwner />
          }
        />

      </Route>

      {/* ===================================================
          MEMBER PROTECTED ROUTES
      =================================================== */}

      <Route
        element={
          <ProtectedRoute />
        }
      >

        <Route
          element={
            <MemberLayout />
          }
        >

          {/* =============================================
              PROFESSIONAL PAYMENT
          ============================================= */}

          <Route
            path="/professional-payment"
            element={
              <ProfessionalPayment />
            }
          />

          {/* =============================================
              PROFILE
          ============================================= */}

          <Route
            path="/profile"
            element={
              <Profile />
            }
          />

          <Route
            path="/profile/edit"
            element={
              <EditProfile />
            }
          />

          {/* =============================================
              QR CODE
          ============================================= */}

          <Route
            path="/qr-code"
            element={
              <QRCode />
            }
          />

          {/* =============================================
              BASIC PAYMENT
          ============================================= */}

          <Route
            path="/payment"
            element={
              <Payment />
            }
          />

          {/* =============================================
              NETWORK
          ============================================= */}

          <Route
            path="/direct_network"
            element={
              <DirectNetwork />
            }
          />

          {/* =============================================
              ROYALTY
          ============================================= */}

          <Route
            path="/royalty-rewards"
            element={
              <RoyaltyRewards />
            }
          />

          {/* =============================================
              BANK
          ============================================= */}

          <Route
            path="/bank_form/:token"
            element={
              <BankDetails />
            }
          />

          {/* =============================================
              LEGAL ENTITY
          ============================================= */}

          <Route
            path="/legal_entity/:token"
            element={
              <LegalEntity />
            }
          />

          {/* =============================================
              PAN
          ============================================= */}

          <Route
            path="/pan/:token"
            element={
              <PanDetails />
            }
          />

          {/* =============================================
              PROFILE PICTURE
          ============================================= */}

          <Route
            path="/profile_picture/:token"
            element={
              <ProfilePicture />
            }
          />

          {/* =============================================
              CIVILIAN ACKNOWLEDGEMENT
          ============================================= */}

          <Route
            path="/civilian-acknowledgement/:token"
            element={
              <CivilianAcknowledgement />
            }
          />

        </Route>

      </Route>

      {/* ===================================================
          UNKNOWN ROUTE
      =================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  );
}