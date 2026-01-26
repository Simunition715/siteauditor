// TRUE POSITIVE: Long function with high complexity and multiple responsibilities
// Expected: SMELL001 finding

function processUserData(userId: string, email: string, name: string) {
  // Validation phase
  if (!userId || userId.length === 0) {
    throw new Error("Invalid user ID");
  }
  if (!email || !email.includes("@")) {
    throw new Error("Invalid email");
  }
  if (!name || name.length < 2) {
    throw new Error("Invalid name");
  }

  // Data transformation phase
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedName = name.trim();
  const userData = {
    id: userId,
    email: normalizedEmail,
    name: normalizedName,
    createdAt: new Date(),
  };

  // Database operations
  const db = connectToDatabase();
  const existingUser = db.findUser(userId);
  if (existingUser) {
    db.updateUser(userId, userData);
  } else {
    db.createUser(userData);
  }

  // Notification phase
  sendWelcomeEmail(normalizedEmail);
  sendSlackNotification(`New user: ${normalizedName}`);
  logUserCreation(userId);

  // Analytics phase
  trackEvent("user_created", { userId, email: normalizedEmail });
  updateUserMetrics(userId);

  // More complex logic...
  if (userData.email.includes("admin")) {
    grantAdminAccess(userId);
  }
  if (userData.name.includes("VIP")) {
    upgradeToPremium(userId);
  }

  // Even more operations...
  syncWithExternalService(userId);
  updateCache(userId, userData);
  invalidateSession(userId);

  return userData;
}

// This function should be flagged - it's 200+ lines with high complexity
function anotherLongFunction() {
  let x = 0;
  for (let i = 0; i < 100; i++) {
    if (i % 2 === 0) {
      x += i;
      if (x > 1000) {
        x = x / 2;
        if (x < 500) {
          x = x * 2;
        }
      }
    } else {
      x -= i;
      if (x < 0) {
        x = 0;
        if (x === 0) {
          x = 1;
        }
      }
    }
  }
  return x;
}
