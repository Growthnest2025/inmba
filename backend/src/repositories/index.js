const memberRepository =
  require(
    "./member.repository"
  );

const adminRepository =
  require(
    "./admin.repository"
  );

const eventRepository =
  require(
    "./event.repository"
  );

const registrationRepository =
  require(
    "./registration.repository"
  );

const authRepository =
  require(
    "./auth.repository"
  );

const passwordResetRepository =
  require(
    "./passwordReset.repository"
  );

module.exports = {
  memberRepository,
  adminRepository,
  eventRepository,
  registrationRepository,
  authRepository,
  passwordResetRepository,
};