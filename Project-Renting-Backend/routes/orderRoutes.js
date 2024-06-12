import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import { isAdmin, isAuth } from '../utils.js';
import Reservation from '../models/reservationModel.js';

const orderRouter = express.Router();

//get order all orders router
orderRouter.get(
  '/',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.find().populate('user', 'name'); // populate provide provide additional user information in each order
    res.send(orders);
  })
);

//get order orders by date router
orderRouter.post(
  '/orders-by-date',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.find({
      createdAt: {
        $gte: [     //greater than date range
          {
            $dateToString: {
              date: '$createdAt',
              format: '%Y-%m-%dT%H:%M:%SZ',
              timezone: 'UTC',
            },
          },
          req.body.startDate,
        ],
        $lt: [    //less than date range
          {
            $dateToString: {
              date: '$createdAt',
              format: '%Y-%m-%dT%H:%M:%SZ',
              timezone: 'UTC',
            },
          },
          req.body.endDate,
        ],
      },
    }).populate('user', 'name');
    if (order) {
      res.send(order);  // Send the order details as a response back to the client
    } else {
      res.status(404).send({ message: 'Orders Not Found' });
    }
  })
);

//Update Order
const updateOrder = async (prod_Id, qnt) => {
  const productQuery = Product.findOne({ _id: prod_Id });
  const productData = await productQuery.exec(); // Execute the query and wait for the result
  if (!productData) {
    console.log(`Product not found for ID: ${element.product}`);
  } else {
    // Update the product count
    productData.countInStock -= qnt;
  }
  // Save the updated product
  await productData.save();
};

//create new order router
orderRouter.post(
  '/',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const newOrder = Order({
      orderItems: req.body.orderItems.map((x) => ({ ...x, product: x._id })), // Map and modify order items
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod,
      itemsPrice: req.body.itemsPrice,
      shippingPrice: req.body.shippingPrice,
      totalPrice: req.body.totalPrice,
      user: req.user._id, // Associate the order with the authenticated user
      deliveryStatus: 'Preparing',
    });
    // Iterate through order items and update product counts in stock
    try {
      newOrder.orderItems.forEach((element) => {
        updateOrder(element.product, element.quantity);
      });
    } catch (error) {}
    const order = await newOrder.save();
    res.status(201).send({ message: 'New Order Created', order });
  })
);

//get summary API (data for charts)
orderRouter.get(
  '/summary',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    //total sales of order
    const orders = await Order.aggregate([
      {
        $group: {
          _id: null,
          numOrders: { $sum: 1 },  //count of order
          totalSales: { $sum: '$totalPrice' },
        },
      },
    ]);
    // total sales of reservation
    const reservations = await Reservation.aggregate([
      {
        $group: {
          _id: null,
          numOrders: { $sum: 1 },
          totalSales: { $sum: '$totalPrice' },
        },
      },
    ]);
    //total users
    const users = await User.aggregate([
      {
        $group: {
          _id: null,
          numUsers: { $sum: 1 },
        },
      },
    ]);
    // daily order sales
    const dailyOrders = await Order.aggregate([
      {
        // Stage 1: Group orders by the creation date
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },    // Count the number of orders for each date
          sales: { $sum: '$totalPrice' },   // Calculate the total sales amount for each date
        },
      },
      // Stage 2: Sort the results by the creation date in ascending order
      { $sort: { _id: 1 } },
    ]);
    // calculate monthly orders sales
    const monthlyOrders = await Order.aggregate([
      {
        // Match reservations created in the last 12 months
        $match: {
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalPrice' },
        },
      },
      {

        // Sort the results by year and month
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
        },
      },
      {
        // Project the result to a new structure
        $project: {
          _id: 0, // Exclude the default MongoDB _id field
          month: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id.month', 1] }, then: 'Jan' },
                { case: { $eq: ['$_id.month', 2] }, then: 'Feb' },
                { case: { $eq: ['$_id.month', 3] }, then: 'March' },
                { case: { $eq: ['$_id.month', 4] }, then: 'April' },
                { case: { $eq: ['$_id.month', 5] }, then: 'May' },
                { case: { $eq: ['$_id.month', 6] }, then: 'June' },
                { case: { $eq: ['$_id.month', 7] }, then: 'July' },
                { case: { $eq: ['$_id.month', 8] }, then: 'Aug' },
                { case: { $eq: ['$_id.month', 9] }, then: 'Sept' },
                { case: { $eq: ['$_id.month', 10] }, then: 'Oct' },
                { case: { $eq: ['$_id.month', 11] }, then: 'Nov' },
                { case: { $eq: ['$_id.month', 12] }, then: 'Dec' },
              ],
              default: 'Unknown',
            },
          },
          year: '$_id.year',
          count: 1,
          totalAmount: 1,
        },
      },
    ]);
    // calculate monthly reservations
    const monthlyReservations = await Reservation.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalPrice' },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
        },
      },
      {
        $project: {
          _id: 0,
          month: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id.month', 1] }, then: 'Jan' },
                { case: { $eq: ['$_id.month', 2] }, then: 'Feb' },
                { case: { $eq: ['$_id.month', 3] }, then: 'March' },
                { case: { $eq: ['$_id.month', 4] }, then: 'April' },
                { case: { $eq: ['$_id.month', 5] }, then: 'May' },
                { case: { $eq: ['$_id.month', 6] }, then: 'June' },
                { case: { $eq: ['$_id.month', 7] }, then: 'July' },
                { case: { $eq: ['$_id.month', 8] }, then: 'Aug' },
                { case: { $eq: ['$_id.month', 9] }, then: 'Sept' },
                { case: { $eq: ['$_id.month', 10] }, then: 'Oct' },
                { case: { $eq: ['$_id.month', 11] }, then: 'Nov' },
                { case: { $eq: ['$_id.month', 12] }, then: 'Dec' },
              ],
              default: 'Unknown',
            },
          },
          year: '$_id.year',
          count: 1,
          totalAmount: 1,
        },
      },
    ]);
    // calculate daily reservations
    const dailyReservations = await Reservation.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          sales: { $sum: '$totalPrice' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // aggregate orders with delivery status 'Preparing'
    const preparingOrders = await Order.aggregate([
      { $group: { _id: '$deliveryStatus', count: { $sum: 1 } } },
      { $match: { _id: 'Preparing' } },
    ]);
    // aggregate orders with delivery status 'delivered'
    const completedOrders = await Order.aggregate([
      { $group: { _id: '$deliveryStatus', count: { $sum: 1 } } },
      { $match: { _id: 'Delivered' } },
    ]);
    //aggregate reservations with delivery status 'Preparing'
    const preparingReservations = await Reservation.aggregate([
      {
        $match: {
          $and: [{ deliveryStatus: 'Preparing' }, { isPaid: true }],
        },
      },
      { $group: { _id: '$deliveryStatus', count: { $sum: 1 } } },
    ]);
    //aggregate reservations with delivery status 'completed'
    const completedReservations = await Reservation.aggregate([
      { $group: { _id: '$deliveryStatus', count: { $sum: 1 } } },
      { $match: { _id: 'Completed' } },
    ]);
    // getting products based on categories
    const productCategories = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);
    //filter reservation based on reservation date
    const reservationsByDate = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalAmount: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
      {
        $match: {
          _id: {
            $gte: '2023-01-01T00:00:00Z',
            $lte: '2023-04-15T23:59:59Z',
          },
        },
      },
    ]);

    res.send({
      users,
      orders,
      reservations,
      dailyOrders,
      monthlyOrders,
      monthlyReservations,
      preparingOrders,
      completedOrders,
      dailyReservations,
      preparingReservations,
      completedReservations,
      productCategories,
      reservationsByDate,
    });
  })
);

//get summary by date API (data for charts)
// filter by date orders
orderRouter.post(
  '/filter-by-date',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.aggregate([
      {
        $match: {
          $expr: { // allows to define conditions using aggregation expressions
            $and: [ // combine multiple conditions within the $expr
              {
                $gte: [
                  {
                    $dateToString: {
                      date: '$createdAt',
                      format: '%Y-%m-%dT%H:%M:%SZ',
                      timezone: 'UTC',
                    },
                  },
                  req.body.startDate,
                ],
              },
              {
                $lt: [
                  {
                    $dateToString: {
                      date: '$createdAt',
                      format: '%Y-%m-%dT%H:%M:%SZ',
                      timezone: 'UTC',
                    },
                  },
                  req.body.endDate,
                ],
              },
            ],
          },
        },
      },

      // Group documents by null and calculate the sum of reservations
      {
        $group: {
          _id: null,
          numOrders: { $sum: 1 },
          totalSales: { $sum: '$totalPrice' },
        },
      },
    ]);
    // filter the preparing order
    const preparingOrders = await Order.aggregate([
      {
        $match: {
          deliveryStatus: 'Preparing',
          isPaid: true,
          $expr: {
            $and: [
              {
                $gte: [
                  {
                    $dateToString: {
                      date: '$createdAt',
                      format: '%Y-%m-%dT%H:%M:%SZ',
                      timezone: 'UTC',
                    },
                  },
                  req.body.startDate,
                ],
              },
              {
                $lt: [
                  {
                    $dateToString: {
                      date: '$createdAt',
                      format: '%Y-%m-%dT%H:%M:%SZ',
                      timezone: 'UTC',
                    },
                  },
                  req.body.endDate,
                ],
              },
            ],
          },
        },
      },

      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalSales: { $sum: '$totalPrice' },
        },
      },
    ]);
    // filter the completed orders
    const completedOrders = await Order.aggregate([
      {
        $match: {
          deliveryStatus: 'Delivered',
          $expr: {
            $and: [
              {
                $gte: [
                  {
                    $dateToString: {
                      date: '$createdAt',
                      format: '%Y-%m-%dT%H:%M:%SZ',
                      timezone: 'UTC',
                    },
                  },
                  req.body.startDate,
                ],
              },
              {
                $lt: [
                  {
                    $dateToString: {
                      date: '$createdAt',
                      format: '%Y-%m-%dT%H:%M:%SZ',
                      timezone: 'UTC',
                    },
                  },
                  req.body.endDate,
                ],
              },
            ],
          },
        },
      },

      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalSales: { $sum: '$totalPrice' },
        },
      },
    ]);
    // filter orders by date
    const OrdersByDate = await Order.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              {
                $gte: [
                  {
                    $dateToString: {
                      date: '$createdAt',
                      format: '%Y-%m-%dT%H:%M:%SZ',
                      timezone: 'UTC',
                    },
                  },
                  req.body.startDate,
                ],
              }, //"2022-04-10T00:00:00Z"
              {
                $lt: [
                  {
                    $dateToString: {
                      date: '$createdAt',
                      format: '%Y-%m-%dT%H:%M:%SZ',
                      timezone: 'UTC',
                    },
                  },
                  req.body.endDate,
                ],
              }, //"2023-02-16T00:00:00Z"
            ],
          },
        },
      },

      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalSales: { $sum: '$totalPrice' },
        },
      },
    ]);

    res.send({ orders, preparingOrders, completedOrders, OrdersByDate });
  })
);

//get orders by user router
// get order by user Id
orderRouter.get(
  '/mine',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.find({ user: req.user._id });
    if (order) {
      res.send(order);
    } else {
      res.status(404).send({ message: 'Order Not Found' });
    }
  })
);

//page size for pagination
const PAGE_SIZE = 3;

//get orders by location router
orderRouter.post(
  '/by-location',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const page = query.page || 1;
    const pageSize = query.pageSize || PAGE_SIZE;

    const orders = await Order.find({
      'shippingAddress.address': req.body.address,
    })
      .skip(pageSize * (page - 1))
      .limit(pageSize);

    const countOrders = await Order.find({
      'shippingAddress.address': req.body.address,
    }).count();

    res.send({
      orders,
      countOrders,
      page,
      pages: Math.ceil(countOrders / pageSize),
    });
  })
);

//get not-delivered orders router
orderRouter.post(
  '/by-location/not-delivered',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.find({
      $and: [
        { 'shippingAddress.address': req.body.address },
        { deliveryStatus: 'Dispatched' },
      ],
    });

    if (orders) {
      res.send(orders);
    } else {
      res.status(404).send({ message: 'Orders Not Found' });
    }
  })
);

//get order by id router
// get order by order id
orderRouter.get(
  '/:id',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      res.send(order);
    } else {
      res.status(404).send({ message: 'Order Not Found' });
    }
  })
);

//update order by id router
// update order by delivery status dispatched
orderRouter.put(
  '/:id/dispatch',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isDispatched = true;
      order.deliveryStatus = 'Dispatched';
      order.dispatchedAt = Date.now();
      await order.save();
      res.send({ message: 'Order Dispatched' });
    } else {
      res.status(404).send({ message: 'Order Not Found' });
    }
  })
);

//change order delivery status router
// update order by delivery status delivered
orderRouter.put(
  '/:id/deliver',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.deliveryStatus = 'Delivered';
      order.deliveredAt = Date.now();
      await order.save();
      res.send({ message: 'Order Delivered' });
    } else {
      res.status(404).send({ message: 'Order Not Found' });
    }
  })
);

//change order payment status router
// update order by payment status as paid
orderRouter.put(
  '/:id/pay',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address,
      };
      const updatedOrder = await order.save();
      res.send({
        message: 'Payment Completed Successfully',
        order: updatedOrder,
      });
    } else {
      res.status(404).send({ message: 'Order Not Found' });
    }
  })
);

export default orderRouter;
