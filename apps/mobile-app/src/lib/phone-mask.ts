const PHONE_PREFIX = "+7";
const NATIONAL_PHONE_LENGTH = 10;

export function getRussianNationalPhoneDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  const withoutCountryCode = digits.startsWith("7") || digits.startsWith("8") ? digits.slice(1) : digits;
  return withoutCountryCode.slice(0, NATIONAL_PHONE_LENGTH);
}

export function formatRussianPhone(value: string) {
  const digits = getRussianNationalPhoneDigits(value);
  const operatorCode = digits.slice(0, 3);
  const firstPart = digits.slice(3, 6);
  const secondPart = digits.slice(6, 8);
  const thirdPart = digits.slice(8, 10);

  let formatted = `${PHONE_PREFIX} `;
  if (operatorCode) {
    formatted += `(${operatorCode}`;
  }
  if (operatorCode.length === 3) {
    formatted += ")";
  }
  if (firstPart) {
    formatted += ` ${firstPart}`;
  }
  if (secondPart) {
    formatted += `-${secondPart}`;
  }
  if (thirdPart) {
    formatted += `-${thirdPart}`;
  }

  return formatted;
}

export function isRussianPhoneComplete(value: string) {
  return getRussianNationalPhoneDigits(value).length === NATIONAL_PHONE_LENGTH;
}
