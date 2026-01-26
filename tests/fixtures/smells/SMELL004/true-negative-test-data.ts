// TRUE NEGATIVE: Test file with duplicate strings (should NOT be flagged)
// Expected: NO SMELL004 finding (test files are excluded)

describe("UserService", () => {
  it("should create user", () => {
    const mockUser = {
      name: "Test User",
      email: "test@example.com",
    };
    // Duplicate strings in test files are OK
    expect(mockUser.name).toBe("Test User");
    expect(mockUser.email).toBe("test@example.com");
  });

  it("should update user", () => {
    const mockUser = {
      name: "Test User", // Duplicate but in test file
      email: "test@example.com", // Duplicate but in test file
    };
    // Should not be flagged
  });
});
