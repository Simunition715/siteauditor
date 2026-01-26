// TRUE NEGATIVE: Constructor with many parameters (should NOT be flagged)
// Expected: NO SMELL003 finding

class User {
  constructor(
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    address: string,
    city: string,
    state: string,
    zipCode: string
  ) {
    // Constructors are allowed more parameters
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.phone = phone;
    this.address = address;
    this.city = city;
    this.state = state;
    this.zipCode = zipCode;
  }
}

// Config function with many parameters - OK
function createConfig(
  apiUrl: string,
  apiKey: string,
  timeout: number,
  retries: number,
  cacheEnabled: boolean,
  logLevel: string,
  enableAuth: boolean,
  enableMetrics: boolean,
  enableTracing: boolean,
  maxConnections: number
) {
  // Config functions are allowed more parameters
  return { apiUrl, apiKey, timeout };
}
