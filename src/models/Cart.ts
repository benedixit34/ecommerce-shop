import mongoose, { Schema } from 'mongoose';
import { ICart } from '../types';

const cartSchema = new Schema<ICart>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [{
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    }
  }],
  total: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default mongoose.model<ICart>('Cart', cartSchema);
