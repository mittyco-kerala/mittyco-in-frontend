import client from "../../../lib/ApiClient";

const notificationsUrl = "welcome-bonus-notifications/";

export const getWelcomeBonusNotifications = () => client.get(notificationsUrl);

export const claimWelcomeBonus = (notificationId) =>
    client.post(`${notificationsUrl}${notificationId}/claim/`);

export const markWelcomeBonusNotificationRead = (notificationId) =>
    client.post(`${notificationsUrl}${notificationId}/read/`);

// The returned redemption code deliberately has no persistence layer. Callers
// must pass it straight to the clipboard and let the local variable go out of scope.
export const copyWelcomeBonusCode = (notificationId) =>
    client.post(`${notificationsUrl}${notificationId}/copy-code/`);
