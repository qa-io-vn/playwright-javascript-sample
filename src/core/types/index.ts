export interface User {
  username: string;
  password?: string;
  type?: string;
}

export interface Product {
  id: string;
  name: string;
  price: string;
  desc?: string;
}

export interface CheckoutInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}
