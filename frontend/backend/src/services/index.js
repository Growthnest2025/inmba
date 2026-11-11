const registrationService =
  require(
    "./registration.service"
  );

const fileStorageService =
  require(
    "./fileStorage.service"
  );

const authService =
  require(
    "./auth.service"
  );

const passwordResetService =
  require(
    "./passwordReset.service"
  );

const dashboardService =
  require(
    "./dashboard.service"
  );

const profileService =
  require(
    "./profile.service"
  );

const paymentService =
  require(
    "./payment.service"
  );

const bankPanService =
  require(
    "./bankPan.service"
  );

const legalEntityService =
  require(
    "./legalEntity.service"
  );

const signatureService =
  require(
    "./signature.service"
  );

const acknowledgementService =
  require(
    "./acknowledgement.service"
  );

const qrCodeService =
  require(
    "./qrCode.service"
  );

const networkService =
  require(
    "./network.service"
  );

const publicProfileService =
  require(
    "./publicProfile.service"
  );

const royaltyService =
  require(
    "./royalty.service"
  );

const adminAuthService =
  require(
    "./adminAuth.service"
  );

const adminMemberService =
  require(
    "./adminMember.service"
  );

const adminMemberActionService =
  require(
    "./adminMemberAction.service"
  );

const adminEventService =
  require(
    "./adminEvent.service"
  );

const backupService =
  require(
    "./backup.service"
  );

const publicProfileOwnerService =
  require(
    "./publicProfileOwner.service"
  );

const legacyPageService =
  require(
    "./legacyPage.service"
  );

const downloadService =
  require(
    "./download.service"
  );

const policyService =
  require(
    "./policy.service"
  );

const memberDirectoryService =
  require(
    "./memberDirectory.service"
  );

const profileCompletionService =
  require(
    "./profileCompletion.service"
  );

module.exports = {
  registrationService,
  fileStorageService,
  authService,
  passwordResetService,
  dashboardService,
  profileService,
  paymentService,
  bankPanService,
  legalEntityService,
  signatureService,
  acknowledgementService,
  qrCodeService,
  networkService,
  publicProfileService,
  royaltyService,
  adminAuthService,
  adminMemberService,
  adminMemberActionService,
  adminEventService,
  backupService,
  publicProfileOwnerService,
  legacyPageService,
  downloadService,
  policyService,
  memberDirectoryService,
  profileCompletionService,
};