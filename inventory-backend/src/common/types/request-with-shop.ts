export interface RequestWithShop extends Request {
  user: {
    userId: string;
    email: string;
    name?: string | null;
  };
  shop: {
    shopId: string;
    role: 'OWNER' | 'MANAGER' | 'STAFF';
  };
}
