const blockedDomains = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "test.org",
  "test.net",
  "invalid",
  "invalid.com",
  "localhost",
]);

export const isValidEmail = (email: string) => {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return false;
  const domain = normalized.split("@")[1];
  if (!domain) return false;
  if (blockedDomains.has(domain)) return false;
  return true;
};
