const Category = require("../models/category");
const Item = require("../models/item");
const async = require("async");
const { body, validationResult } = require("express-validator");

exports.category_list = function (req, res) {
  Category.find({}, function (err, result) {
    console.log(result);
    res.render("index", { title: "Grocery App", error: err, data: result });
  });
};

exports.category_detail = function (req, res, next) {
  const categoryId = req.params.id;
  async.parallel(
    {
      items: function (callback) {
        Item.find({ category: categoryId }).populate("category").exec(callback);
      },
      category: function (callback) {
        Category.findOne({ _id: categoryId }).exec(callback);
      },
    },
    function (err, result) {
      if (err) {
        return next(err);
      }

      // No Results
      if (result.category === null) {
        const err = new Error("Category not found");
        err.status = 404;
        return next(err);
      }

      if (result.items <= 0) {
        res.render("category-detail", {
          title: "No Category Items",
          data: result.items,
          category: result.category,
        });
        return;
      }

      res.render("category-detail", {
        title: result.category.name,
        data: result.items,
        category: result.category,
      });
    }
  );
};

exports.category_create_get = function (req, res) {
  res.render("category-create", { updated: false, formAction: req.url, title: "Add Category", errors: undefined, data: undefined});
};

exports.category_create_post = [
  // Validate and sanitize the name field.
  body("categoryName", "Category name required")
    .trim()
    .isLength({ min: 1 })
    .escape(),

  body("categoryDescr", "Category Description required")
    .trim()
    .isLength({ min: 1 })
    .escape(),

  // Process request after validation and sanitization.
  function (req, res, next) {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    const newCategory = new Category({
      name: req.body.categoryName,
      description: req.body.categoryDescr,
    });

    if (!errors.isEmpty()) {
      res.render("category-create", {
        title: "Add Category",
        errors: errors.array(),
      });
    } else {
      Category.findOne({ name: req.body.categoryName }).exec(function (
        err,
        found_category
      ) {
        if (err) {
          return next(err);
        }

        if (found_category) {
          // Category exists, redirect to its detail page.
          res.redirect(found_category.url);
        } else {
          newCategory.save(function (err) {
            if (err) {
              return next(err);
            }

            // Category saved. redirect to category detail page.
            res.redirect("/catalog");
          });
        }
      });
    }
  },
];

// Not used in this version
exports.category_delete_get = function (req, res) {
  res.send("NOT IMPLEMNETED");
};

exports.category_delete_post = function (req, res, next) {
  const categoryId = req.params.id;
  Category.deleteOne({ _id: categoryId }).exec(function (err) {
    if (err) {
      return next(err);
    }

    res.redirect("/catalog");
  });
};

exports.category_update_get = function (req, res, next) {
  const categoryId = req.params.id;
  Category.findOne({ _id: categoryId }).exec(function (err, result) {
    if (err) {
      return next(err);
    }

    if (result === null) {
      const err = new Error("Category not found");
      err.status = 404;
      return next(err);
    }

    res.render('category-create', { updated: true, formAction: req.url, title: "Update Category", errors: undefined, data: result });
  });
};

exports.category_update_post = [
  // Validate and sanitize
  body("categoryName", "Category name required")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  
  body("categoryDescr", "Category Description required")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  
  // Process request after validation and sanitization
  function (req, res, next) {

    const categoryId = req.params.id;

    // Extract the validation errors from a request.
    const errors = validationResult(req);

    const updatedCategory = new Category({
      _id: categoryId,   // This is required, or a new ID will be assigned!
      name: req.body.categoryName,
      description: req.body.categoryDescr,
    });

    if (!errors.isEmpty()) {
      
      Category.findOne({ _id: categoryId }).exec(function (err, result) {
        if (err) {
          return next(err);
        }

        if (result === null) {
          const err = new Error("Category not found");
          err.status = 404;
          return next(err);
        }

        res.render("category-create", {
          updated: true,
          formAction: req.url,
          title: "Update Category",
          errors: undefined,
          data: result,
        });
      });
      
      return;
    } else {
      Category.findByIdAndUpdate(categoryId, updatedCategory, {}).exec(function (err, theCategory) {
        if (err) {
          return next(err);
        }


        res.redirect(theCategory.url);
      })
    }

  }
];