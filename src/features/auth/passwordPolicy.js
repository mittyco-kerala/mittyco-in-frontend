export const PASSWORD_POLICY_HELP = "Password must be at least 8 characters long and include letters, numbers, and symbols.";
export const PASSWORD_POLICY_ERROR = "Password must be at least 8 characters long and include uppercase letters, lowercase letters, a number, and a special symbol.";

export function isStrongPassword(password = "") {
    return password.length >= 8
        && /[A-Z]/.test(password)
        && /[a-z]/.test(password)
        && /\d/.test(password)
        && /[^A-Za-z0-9]/.test(password);
}

export function getPasswordPolicyError(password = "") {
    return isStrongPassword(password) ? "" : PASSWORD_POLICY_ERROR;
}
