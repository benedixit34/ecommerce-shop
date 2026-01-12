import Flutterwave from 'flutterwave-node-v3';

const flw = new Flutterwave({
  public_key: process.env.FLUTTERWAVE_PUBLIC_KEY as string,
  secret_key: process.env.FLUTTERWAVE_SECRET_KEY as string,
});

export default flw;
