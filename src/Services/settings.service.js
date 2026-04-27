import Settings from "../Model/Settings.js";

// ==========================================
// ⚙️ GLOBAL SETTINGS SERVICES
// ==========================================

/**
 * ✅ GET SYSTEM SETTINGS (Admin Only)
 * Retrieves the global settings document. Implements the Singleton pattern:
 * If no settings document exists in the database, it creates the default one.
 */
export const getSettings = async (user) => {
  // Strict RBAC: Only Admins can view/modify global system settings
  if (user.role !== "admin") {
    throw new Error("Access Denied: Only Administrators can access system settings.");
  }

  let settings = await Settings.findOne();

  // Singleton Auto-Initialization
  if (!settings) {
    settings = await Settings.create({});
  }

  return settings;
};

/**
 * ✅ UPDATE SYSTEM SETTINGS (Admin Only)
 * Partially or fully updates the global settings singleton.
 */
export const updateSettings = async (user, data) => {
  if (user.role !== "admin") {
    throw new Error("Access Denied: Only Administrators can modify system settings.");
  }

  let settings = await Settings.findOne();

  // Singleton Auto-Initialization fallback
  if (!settings) {
    settings = await Settings.create(data);
    return settings;
  }

  // Deep merge for nested objects (preferences, security)
  if (data.preferences) {
    settings.preferences = { ...settings.preferences, ...data.preferences };
  }
  if (data.security) {
    settings.security = { ...settings.security, ...data.security };
  }

  // Assign top-level strings and arrays
  if (data.companyName) settings.companyName = data.companyName;
  if (data.currency) settings.currency = data.currency;
  if (data.timezone) settings.timezone = data.timezone;
  if (data.leadSources) settings.leadSources = data.leadSources;
  if (data.dealStages) settings.dealStages = data.dealStages;
  if (data.accountHealthStatuses) settings.accountHealthStatuses = data.accountHealthStatuses;

  await settings.save();
  return settings;
};