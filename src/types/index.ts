import { Request } from 'express';
import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  phone?: string;
  address: IAddress[];
  avatar?: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  isVerified: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
}

export interface IAddress {
  _id?: Types.ObjectId;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  category: Types.ObjectId;
  brand?: string;
  images: IProductImage[];
  inventory: {
    quantity: number;
    sku?: string;
  };
  specifications?: Map<string, string>;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  rating: {
    average: number;
    count: number;
  };
  isFeatured: boolean;
  isActive: boolean;
  tags: string[];
  seoMetadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export interface IProductImage {
  url: string;
  publicId?: string;
}

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  parent?: Types.ObjectId;
  image?: string;
  isActive: boolean;
}

export interface ICart extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  items: ICartItem[];
  total: number;
}

export interface ICartItem {
  product: Types.ObjectId;
  quantity: number;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  orderNumber: string;
  items: IOrderItem[];
  shippingAddress: IAddress;
  paymentMethod: 'card' | 'paypal' | 'cod';
  paymentResult?: {
    id: string;
    status: string;
    updateTime: string;
  };
  subtotal: number;
  tax: number;
  shippingFee: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  isPaid: boolean;
  paidAt?: Date;
  isDelivered: boolean;
  deliveredAt?: Date;
  trackingNumber?: string;
  notes?: string;
}

export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface IReview extends Document {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  user: Types.ObjectId;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  verified: boolean;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface JwtPayload {
  id: string;
  role: string;
}