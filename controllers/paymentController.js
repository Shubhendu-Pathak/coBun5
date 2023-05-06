import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { User } from "../models/userModel.js";
// import { instance } from "../server.js";
import ErrorHandler from "../utils/errorHandler.js";
import Razorpay from 'razorpay'
import {Payment} from '../models/paymentModel.js'
import crypto from 'crypto'

export const buySubscription = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (user.role === "admin")
    return next(new ErrorHandler("Admin can't buy subscription", 400));

    const instance = new Razorpay({
      key_id: 'rzp_test_0aUVGadUrhYhgZ',
      key_secret: 'W07jLqoQwVyrpkrETumOfrGz',
    });

    // const plan = instance.plans.create({
    //   period: "monthly",
    //   interval: 1,
    //   item: {
    //     name: "Test plan - Monthly",
    //     amount: 69900,
    //     currency: "INR",
    //     description: "Description for the test plan"
    //   },
    //   notes: {
    //     notes_key_1: "Tea, Earl Grey, Hot",
    //     notes_key_2: "Tea, Earl Grey… decaf."
    //   }
    // })

const subscription = await instance.subscriptions.create({
  plan_id: "plan_Llhn7fN0He8AZv",
  quantity: 5,
  total_count: 6,
  
})

  user.subscription.id = subscription.id;

  user.subscription.status = subscription.status;

  await user.save();
// console.log(plan.id);

  res.status(201).json({
    success: true,
    // subscriptionId: subscription.id,
  subscription
  });
});

export const paymentVerification = catchAsyncError(async (req, res, next) => {
  const { razorpay_signature, razorpay_payment_id, razorpay_subscription_id } =
    req.body;

  const user = await User.findById(req.user._id);

  const subscription_id = user.subscription.id;

  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
    .update(razorpay_payment_id + "|" + subscription_id, "utf-8")
    .digest("hex");

  const isAuthentic = generated_signature === razorpay_signature;

  if (!isAuthentic)
    return res.redirect(`${process.env.FRONTEND_URL}/paymentfail`);

  // database comes here
  await Payment.create({
    razorpay_signature,
    razorpay_payment_id,
    razorpay_subscription_id,
  });

  user.subscription.status = "active";

  await user.save();

  res.redirect(
    `${process.env.FRONTEND_URL}/paymentsuccess?reference=${razorpay_payment_id}`
  );
});

export const getRazorPayKey = catchAsyncError(async (req, res, next) => {
  res.status(200).json({
    success: true,
    key: process.env.RAZORPAY_API_KEY,
  });
});

export const cancelSubscription = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const subscriptionId = user.subscription.id;
  let refund = false;

  await instance.subscriptions.cancel(subscriptionId);

  const payment = await Payment.findOne({
    razorpay_subscription_id: subscriptionId,
  });

  const gap = Date.now() - payment.createdAt;

  const refundTime = process.env.REFUND_DAYS * 24 * 60 * 60 * 1000;

  if (refundTime > gap) {
    await instance.payments.refund(payment.razorpay_payment_id);
    refund = true;
  }

  await payment.deleteOne();
  user.subscription.id = undefined;
  user.subscription.status = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: refund
      ? "Subscription cancelled, You will receive full refund within 7 days."
      : "Subscription cancelled, Now refund initiated as subscription was cancelled after 7 days.",
  });
});
