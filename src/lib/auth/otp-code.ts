export const OTP_CODE_MIN_LENGTH = 6;
export const OTP_CODE_MAX_LENGTH = 10;
export const OTP_CODE_PATTERN = `[0-9]{${OTP_CODE_MIN_LENGTH},${OTP_CODE_MAX_LENGTH}}`;
export const OTP_CODE_PLACEHOLDER = "12345678";
export const OTP_CODE_REQUIREMENT = `${OTP_CODE_MIN_LENGTH}-${OTP_CODE_MAX_LENGTH} digit code`;
export const OTP_CODE_ERROR_MESSAGE = `Enter your email and the ${OTP_CODE_REQUIREMENT} from your email.`;

const otpCodeRegex = new RegExp(`^[0-9]{${OTP_CODE_MIN_LENGTH},${OTP_CODE_MAX_LENGTH}}$`);

export function isValidOtpCode(token: string) {
  return otpCodeRegex.test(token);
}
