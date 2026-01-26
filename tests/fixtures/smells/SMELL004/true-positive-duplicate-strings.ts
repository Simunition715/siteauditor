// TRUE POSITIVE: Duplicate string literals (should be flagged)
// Expected: SMELL004 finding

function processOrder(orderId: string) {
  if (!orderId) {
    throw new Error("ORDER_NOT_FOUND"); // Appears 3+ times
  }

  const order = findOrder(orderId);
  if (!order) {
    throw new Error("ORDER_NOT_FOUND"); // Duplicate
  }

  if (order.status === "cancelled") {
    throw new Error("ORDER_NOT_FOUND"); // Duplicate - should be flagged
  }

  return order;
}

function validateUser(userId: string) {
  if (!userId) {
    return { error: "INVALID_USER_ID" }; // Appears 3+ times
  }

  const user = findUser(userId);
  if (!user) {
    return { error: "INVALID_USER_ID" }; // Duplicate
  }

  if (user.banned) {
    return { error: "INVALID_USER_ID" }; // Duplicate - should be flagged
  }

  return { user };
}
