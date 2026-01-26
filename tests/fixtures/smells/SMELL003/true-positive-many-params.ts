// TRUE POSITIVE: Function with too many parameters (should be flagged)
// Expected: SMELL003 finding

// Regular function with 8 parameters - should be flagged
function createUser(
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  address: string,
  city: string,
  state: string,
  zipCode: string
) {
  // Should use an options object instead
  return { firstName, lastName, email, phone, address, city, state, zipCode };
}

// Another function with 7 parameters - should be flagged
function processOrder(
  orderId: string,
  customerId: string,
  productId: string,
  quantity: number,
  price: number,
  discount: number,
  tax: number
) {
  // Too many parameters
  return orderId;
}
