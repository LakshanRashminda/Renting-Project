import express from "express";
import expressAsyncHandler from "express-async-handler";
import Product from "../models/productModel.js";
import { isAuth, isAdmin } from "../utils.js";

const productRouter = express.Router();

//get all products router
productRouter.get("/", async (req, res) => {
  const products = await Product.find();
  res.send(products);
});

//add new product router
productRouter.post(
  "/",
  isAuth,  // check the request is from an authenticated user
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const newProduct = new Product({  // Create a new product instance with some default values
      name: "sample name " + Date.now(),
      slug: "sample-name-" + Date.now(),
      image: "/images/sample.png",
      price: 0,
      rent: 0,
      penalty: 0,
      category: "sample category",
      brand: "sample brand",
      countInStock: 0,
      countInStockForRent: 0,
      rating: 0,
      numReviews: 0,
      description: "sample description",
    });
    const product = await newProduct.save();    // Save the new product to the database
    res.send({ message: "Product Created", product });  // Send a response back to the client indicating that the product has been created
  })
);

//update product by id router
productRouter.put(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (product) {
      product.name = req.body.name;
      product.slug = req.body.slug;
      product.price = req.body.price;
      product.rent = req.body.rent;
      product.penalty = req.body.penalty;
      product.image = req.body.image;
      product.images = req.body.images;
      product.category = req.body.category;
      product.brand = req.body.brand;
      product.countInStock = req.body.countInStock;
      product.countInStockForRent = req.body.countInStockForRent;
      product.description = req.body.description;
      await product.save();
      res.send({ message: "Product Updated" });
    } else {
      res.status(404).send({ message: "Product Not Found" });
    }
  })
);

//delete product by id router
productRouter.delete(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.remove();
      res.send({ message: "Product Deleted" });
    } else {
      res.status(404).send({ message: "Product Not Found" });
    }
  })
);

//page size for pagination
const PAGE_SIZE = 3;

//get all products with pagination
productRouter.get(
  "/admin",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const page = query.page || 1;  // Extract page and pageSize from the query parameters
    const pageSize = query.pageSize || PAGE_SIZE;

    const products = await Product.find()  // Use Mongoose to query the database for products with pagination
      .skip(pageSize * (page - 1))  // Calculate the number of documents to skip based on pagination
      .limit(pageSize);  // Limit the number of documents returned per page
    const countProducts = await Product.countDocuments();  // Count the total number of products in the database
   // Send the response back to the client with the fetched products, count, and pagination information
    res.send({
      products,
      countProducts,
      page,
      pages: Math.ceil(countProducts / pageSize),  // Total number of pages based on pagination
    });
  })
);

//filter product
productRouter.get(
  "/search",
  expressAsyncHandler(async (req, res) => {
    const { query } = req;

    // Extract query parameters with default values
    const pageSize = query.pageSize || PAGE_SIZE;
    const page = query.page || 1;
    const category = query.category || "";
    const price = query.price || "";
    const rating = query.rating || "";
    const order = query.order || "";
    const searchQuery = query.query || "";

    // Define a filter for the product name based on the search query
    const queryFilter =
      searchQuery && searchQuery !== "all"
        ? {
            name: {
              $regex: searchQuery,
              $options: "i",
            },
          }
        : {};

    //filter product by category
    const categoryFilter = category && category !== "all" ? { category } : {};
    // Filter products by rating
    const ratingFilter =
      rating && rating !== "all"
        ? {
            rating: {
              $gte: Number(rating),
            },
          }
        : {};

    //filter product by price
    const priceFilter =
      price && price !== "all"
        ? {
            // 1-1000
            price: {
              $gte: Number(price.split("-")[0]), // Minimum price
              $lte: Number(price.split("-")[1]), // Maximum price
            },
          }
        : {};
    
        // Determine the sort order based on the 'order' parameter
    const sortOrder =
      order === "featured"
        ? { featured: -1 }
        : order === "lowest"
        ? { price: 1 }
        : order === "highest"
        ? { price: -1 }
        : order === "toprated"
        ? { rating: -1 }
        : order === "newest"
        ? { createdAt: -1 }
        : { _id: -1 }; // Default to sorting by _id in descending order

    const products = await Product.find({
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    })
      .sort(sortOrder)
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    // Count the total number of products in the database that match the filters
    const countProducts = await Product.countDocuments({
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    });

    // Send the response back to the client with the filtered products, count, and pagination information
    res.send({
      products,
      countProducts,
      page,
      pages: Math.ceil(countProducts / pageSize),
    });
  })
);

//Add product review router
productRouter.post(
  "/:id/reviews",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id; // Extract the value of the URL parameter named "id"
    const product = await Product.findById(productId);
    if (product) {
      if (product.reviews.find((x) => x.name === req.user.name)) {   // Check if there is already a review from the authenticated user in the reviews array of the product
        return res
          .status(400)
          .send({ message: "You already submitted a review" });
      }
      // Create a new review object with data from the request
      const review = {
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      };
      product.reviews.push(review); // Add the new review to the 'reviews' array of the product
      product.numReviews = product.reviews.length; // Update the 'numReviews' property of the product to reflect the new number of reviews
      
      // Calculate the average rating for the product based on all reviews
      product.rating =
        product.reviews.reduce((a, c) => c.rating + a, 0) /
        product.reviews.length;
      const updatedProduct = await product.save(); // Save the updated product to the database
      res.status(201).send({
        message: "Review Created",
        review: updatedProduct.reviews[updatedProduct.reviews.length - 1],
        numReviews: product.numReviews, // Updated number of reviews for the product
        rating: product.rating, // Updated average rating for the product
      });
    } else {
      res.status(404).send({ message: "Product Not Found" });
    }
  })
);

//get product categories router
productRouter.get(
  "/categories",
  expressAsyncHandler(async (req, res) => {
    const categories = await Product.find().distinct("category");
    res.send(categories);
  })
);

//get product by slug router
productRouter.get("/slug/:slug", async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (product) {
    res.send(product);
  } else {
    res.status(404).send({ message: "Product Not Found" });
  }
});

//get product by id router
productRouter.get("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    res.send(product);
  } else {
    res.status(404).send({ message: "Product Not Found" });
  }
});

export default productRouter;
