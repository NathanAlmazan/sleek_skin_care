const db = require("../models/db");
const prisma = require("../models/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
require("dotenv").config();
// const messagebird = require("messagebird")("zTuEV2Uw8PRbtbcXKgjrfplyb");

const twilio = require("twilio")(process.env.ACCOUNTSID, process.env.AUTHTOKEN);

/*-- ======== Reusable Function ======= --*/

let createCookies = (id, res) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  return res.cookie("jwt", token, cookieOptions);
};

/*-- ========================== --*/

/*-- ======== log In Page ======= --*/

//Render The Login Page
exports.get_login = (req, res) => {
  res.render("client/login", {
    title: "Log In",
    user: "",
    cartTotal: "",
  });
};

//Log in for existing user
exports.post_login = async (req, res) => {
  const { email, password } = req.body;
  //if the email and password input fields are empty
  if (!email || !password) {
    res.send({ msg: "Please fill out all the fields" });
  } else {
    //check the email from the database if they are exist
    db.query(
      "SELECT * FROM roles JOIN tblcustomer ON roles.customer_id = tblcustomer.customer_id WHERE customer_email=$1",
      [email],
      async (error, results) => {
        if (error) {
          console.log(error);
        } else if (results.rowCount > 0) {
          //if the email are already exist but the password are not same from the database this error will occur
          if (
            !results ||
            !(await bcrypt.compare(password, results.rows[0].customer_password))
          ) {
            res.send({ msg: "Email or Password is incorrect" });
          } else {
            //if the customer are successfully login. the createCookies function will run to create a cookie from the current id of the user
            const id = results.rows[0].customer_id;
            createCookies(id, res);
            res.send({ msg: "", admin: "false" });
          }
        } else {
          db.query(
            "SELECT * FROM roles JOIN tbladmin ON roles.admin_id = tbladmin.admin_id WHERE email_address=$1",
            [email],
            async (error, adminResult) => {
              if (adminResult.rowCount > 0) {
                //  if the email are already exist but the password are not same from the database this error will occur
                if (
                  !adminResult ||
                  !(await bcrypt.compare(password, adminResult.rows[0].password))
                ) {
                  res.send({
                    msg: "Email or Password is incorrect",
                  });
                } else {
                  //if the admin user are successfully login. the createCookies function will run to create a cookie from the current id of the user
                  const id = adminResult.rows[0].admin_id;
                  createCookies(id, res);
                  res.send({ msg: "", admin: "true" });
                }
              } else {
                //if the email are not exist this error will occur
                console.log("wrong pass");
                res.send({
                  msg: "Email or Password is incorrect",
                });
              }
            }
          );
        }
      }
    );
  }
};

//Render The Forgot Page
exports.get_forgot = (req, res) => {
  res.render("client/forgot", {
    title: "Log In",
    user: "",
    cartTotal: "",
  });
};

exports.post_forgot = async (req, res) => {
  const { eORp } = req.body;
  if (!eORp) {
    res.send({ msg: "Phone number is required" });
  } else {
    db.query(
      "SELECT * FROM tblcustomer WHERE customer_contact=$1",
      [eORp],
      (error, results) => {
        if (error) {
          console.log(error);
        } else {
          if (results.rowCount == 0) {
            res.send({
              msg: "No account found with that phone number.",
            });
          } else {
            res.send({ msg: "" });
          }
        }
      }
    );
  }
};
/*-- ========================== --*/

/*-- ======== Signup Page ======= --*/

//Render The Signup Page
exports.get_signup = (req, res) => {
  res.render("client/signup", {
    title: "Sign Up",
    user: "",
    cartTotal: "",
  });
};
let phone;
exports.post_signup = async (req, res) => {
  const { phoneno } = req.body;
  //if phoneno field is empty
  if (!phoneno) {
    res.send({ msg: "Phone no. is required" });
  }

  //contact field must have 10 digits
  else if (phoneno.length <= 9 || phoneno.length >= 11) {
    res.send({ msg: "Phone no. must be 10 digits, with no leading zeros" });
  }
  //if the contact field are not number and not starts with the 9
  else if (isNaN(phoneno) || !phoneno.startsWith("9")) {
    res.send({ msg: "Invalid Phone no." });
  } else {
    //check if the phone are already exist from the database
    db.query(
      "SELECT customer_contact FROM tblcustomer WHERE customer_contact=$1",
      [phoneno],
      async (error, results) => {
        if (error) {
          console.log(error);
        }
        //if the email are already exist from the database this error will occur
        else if (results.rowCount > 0) {
          res.send({ msg: "That Phone no. is already use" });
        } else {
          console.log("Sent to twillio...");
          twilio.verify
            .services(process.env.SERVICEID)
            .verifications.create({
              to: `+63${phoneno}`,
              channel: "sms",
            })
            .then((data) => {
              res.send({ msg: "" });
            }).catch(err => {
              console.log(err);
            });
          phone = phoneno;
        }
      }
    );
  }
};

/*-- ========================== --*/
/*-- ======== Signup OTP Page ======= --*/

//Render The OTP Page
exports.get_signupDetails = (req, res) => {
  res.render("client/otpSignup", {
    title: "Sign Up",
    user: "",
    phoneno: phone,
    cartTotal: "",
  });
};

exports.post_signupDetails1 = async (req, res) => {
  const { code, phoneno } = req.body;

  if (code.length == 0) {
    res.send({ msg: "This field is required" });
  } else {
    twilio.verify
      .services(process.env.SERVICEID)
      .verificationChecks.create({
        to: `+63${phoneno}`,
        code: code,
      })
      .then((data) => {
        console.log(data);
        if (data.status == "approved") {
          res.send({ msg: "" });
        } else if (data.status == "pending") {
          res.send({ msg: "Your verification code is incorrect" });
        }
      });
  }
};

exports.post_signupDetails2 = async (req, res) => {
  const { fname, lname, email, area, position } = req.body;

  db.query(
    "SELECT customer_email FROM tblcustomer WHERE customer_email=$1",
    [email],
    async (error, results) => {
      if (
        (!email || !fname, !lname || area.length == 0 || position.length == 0)
      ) {
        res.send({
          status: "err",
          msg: "All fields are required",
        });
      } else if (fname.length < 2 || lname.length < 2) {
        res.send({
          status: "err",
          msg: "Name must be atleast 2 characters",
        });
      }
      //email field have atleast 7 characters and must have include @ .
      else if (
        email.length < 7 ||
        !email.includes("@") ||
        !email.includes(".")
      ) {
        res.send({
          status: "err",
          msg: "Enter a valid Email",
        });
      }
      //if the email are already exist from the database this error will occur
      else if (results.rowCount > 0) {
        res.send({
          status: "err",
          msg: "That Email is already use",
        });
      } else {
        res.send({ status: "success" });
      }
    }
  );
};

exports.post_signupDetails3 = async (req, res) => {
  const { phoneno, fname, lname, email, area, position, pass1, pass2 } = req.body;

  if (!pass1 || !pass2) {
    res.send({ msg: "All fields are required" });
  }
  //password field should have atleast 8 characters
  else if (pass1.length <= 7) {
    res.send({ msg: "Password must be atleast 8 characters" });
  }
  //if the password and confirm password fields are not match
  else if (pass1 !== pass2) {
    res.send({ msg: "Password confirmation does not match" });
  } else {
    //this salt will add some random string that makes the hash unpredictable
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(pass1, salt);

    //all the info that the user put from the input fields will insert to tblcustomer table
    db.query(
      'INSERT INTO tblcustomer ("customer_fname", "customer_lname", "customer_email", "customer_password", "customer_contact", "customer_position", "customer_area") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [fname, lname, email, hashedPassword, phoneno, position, area],
      (error, results) => {
        if (error) {
          console.log(error);
        } else {
          const id = results.rows[0].customer_id;
          db.query(
            "INSERT INTO roles (customer_id, roles) VALUES ($1, $2)",
            [id, "Customer"],
            (error, results) => {
              if (error) {
                console.log(error);
              } else {
                //if the user are successfully signup. the createCookies function will run and will create a cookie from the current id of the user
                createCookies(id, res);
                res.send({ msg: "" });
              }
            }
          );
        }
      }
    );
  }
};

exports.post_resend = async (req, res) => {
  const { pho } = req.body;
  twilio.verify
    .services(process.env.SERVICEID)
    .verifications.create({
      to: `+63${pho}`,
      channel: "sms",
    })
    .then((data) => {
      res.send({ msg: "" });
    });
};

/*-- ========================== --*/

/*-- ======== Product Details Page ======= --*/

async function getProductDetails(params, user) {
  const productId = parseInt(params);
  const productInfo = await prisma.tblproduct.findUnique({
    where: {
      prod_id: productId
    }, 
    include: {
      tblratings: true
    }
  });

  let result = productInfo;
  const Total_No_Of_Reviews = productInfo.tblratings.length;
  let No_Of_Reviews = 0; 

  productInfo.tblratings.forEach(rating => {
    No_Of_Reviews += rating.score;
  });

  result.No_Of_Reviews = No_Of_Reviews;
  result.Total_No_Of_Reviews = Total_No_Of_Reviews;

  const comments = await prisma.tblratings.findMany({
    where: {
      prods_id: productId
    }, 
    include: {
      tblcustomer: true,
    }, 
    orderBy: {
      date_recorded: 'desc'
    }
  });

  const otherProducts = await prisma.tblproduct.findMany({
    where: {
      AND: {
        prod_categories: productInfo.prod_categories,
        prod_status: "Active"
      }, 
      NOT: {
        prod_id: productId
      }
    },
    include: {
      tblratings: {
        select: {
          score: true
        }
      }
    }
  });

  let relatedProducts = [];

  otherProducts.forEach(product => {
    const Total_No_Of_Reviews = product.tblratings.length;
    let No_Of_Reviews = 0; 

    product.tblratings.forEach(prod => {
      No_Of_Reviews += prod.score;
    });

    product.No_Of_Reviews = No_Of_Reviews;
    product.Total_No_Of_Reviews = Total_No_Of_Reviews;

    relatedProducts.push(product);

  });

  const userRating = await prisma.tblratings.findFirst({
    where: {
      AND: {
        customers_id: user != null ? user.customer_id : undefined,
        prods_id: productId
      }
    }
  });

  const cart = await prisma.tblcart.findMany({
    where: {
      customer_id: user != null ? user.customer_id : undefined
    },
    include: {
      tblproduct: true
    }
  });

  return {
    title: "Product Details",
    user: user,
    products: result,
    comment: comments,
    related: relatedProducts,
    cartTotal: cart,
    userCurrentRate: userRating,
  }

}

//Get
exports.get_details = async (req, res) => {
  const params = req.params.id;
  try {
    if (req.user) {
      //the product details page will render and the user now can order and write reviews
      const data = await getProductDetails(params, req.user);
      res.render("client/product_details", data);

    } else {
      //if the user are not log in, the product details page will still render but they can't order and write reviews
      const data = await getProductDetails(params, null);
      data.user = "";
      res.render("client/product_details", data);
    }
  } catch (error) {
    console.log(error);
  }
};

//Post = For Writing reviews
exports.post_details = (req, res) => {
  try {
    const { rate, remarks } = req.body;
    if (req.user) {
      db.query(
        //the user reviews will insert to the tablratings table from database
        "INSERT INTO tblratings (prod_id, score, remarks, customer_id) VALUES ($1, $2, $3, $4)",
        [params, rate, remarks, req.user.customer_id],
        (error, insert) => {
          if (error) {
            console.log(error);
          } else {
            //if there's no error the page will reload
            res.redirect(`/sleekskincare/product-details/${req.params.id}`);
          }
        }
      );
    } else {
      //if the user are not login the page will direct to login page
      res.redirect("/sleekskincare/login");
    }
  } catch (error) {
    console.log(error);
  }
};

//Post = Adding Item to cart
exports.post_details = (req, res) => {
  try {
    const { quantity } = req.body;
    //if the user are already log in. the item will add to their cart
    if (req.user) {
      db.query(
        //check if the item are already exist from tblcart table
        "SELECT * FROM tblcart WHERE prod_id = $1 AND customer_id = $2",
        [parseInt(req.params.id), parseInt(req.user.customer_id)],
        (error, insert) => {
          if (error) {
            console.log(error);
          }
          //if the item are already exist, Add the new quantity from that item
          if (insert.rows.length > 0) {
            const newQuantity =
              parseInt(insert.rows[0].quantity) + parseInt(quantity);
            db.query(
              "UPDATE tblcart SET quantity = $1 WHERE prod_id = $2 AND customer_id = $3",
              [newQuantity, parseInt(req.params.id), parseInt(req.user.customer_id)],
              (error, insert) => {
                if (error) {
                  console.log(error);
                } else {
                  res.redirect(
                    `/sleekskincare/product-details/${req.params.id}`
                  );
                }
              }
            );
          }
          //if the item are not exist, Add it to tblcart table
          else {
            db.query(
              "INSERT INTO tblcart (customer_id, prod_id, quantity) VALUES ($1, $2, $3)",
              [req.user.customer_id, req.params.id, quantity],
              (error, insert) => {
                if (error) {
                  console.log(error);
                } else {
                  res.redirect(
                    `/sleekskincare/product-details/${req.params.id}`
                  );
                }
              }
            );
          }
        }
      );
    } else {
      //If user are not login. the page will direct to login page
      res.redirect("/sleekskincare/login");
    }
  } catch (error) {
    console.log(error);
  }
};
/*-- ========================== --*/

/*-- ======== Cart Page ======= --*/

async function findRelatedProducts(productId, callback) {
  try {
    let resultedProdcuts = []
    const referenceProduct = await prisma.tblproduct.findFirst({
      where: {
        prod_id: productId
      },
      select: {
        prod_categories: true
      }
    });

    const products = await prisma.tblproduct.findMany({
      where: {
        AND: {
          prod_status: "Active",
          prod_categories: referenceProduct.prod_categories != null ? referenceProduct.prod_categories : undefined
        }
      },
      include: {
        tblratings: {
          select: {
            score: true
          }
        }
      }
    });

    products.forEach(product => {
      const Total_No_Of_Reviews = product.tblratings.length;
      let No_Of_Reviews = 0; 

      product.tblratings.forEach(prod => {
        No_Of_Reviews += prod.score;
      });

      product.No_Of_Reviews = No_Of_Reviews;
      product.Total_No_Of_Reviews = Total_No_Of_Reviews;

      resultedProdcuts.push(product);

    });

    if (typeof callback === "function") callback(null, resultedProdcuts);
    else return resultedProdcuts;

  } catch (error) {
    if (typeof callback === "function") callback(error, null);
    else return null;
  }

}

//Get
exports.get_cart = (req, res) => {
  try {
    //if the user are log in. the cart page will render with their cart item
    if (req.user) {
      findRelatedProducts(
        req.cart.length > 0 ? req.cart[0].prod_id : 1,
        (error, results) => {
          if (error) {
            console.log(error);
          } else {
            //if the user have already item on their cart, show it all
            if (req.cart.length > 0) {
              res.render("client/cart", {
                title: "Your Order",
                user: req.user,
                cartTotal: req.cart,
                cartShow: req.cart,
                products: results,
              });
            } else {
              //if they don't have any item on their cart, still show the table but with message empty basket
              
              res.render("client/cart", {
                title: "Your Order",
                user: req.user,
                cartTotal: "",
                cartShow: "",
                products: results,
              });
            }
          }
        }
      );
    } else {
      //if the user are not log in. it will still render the cart page but empty
      res.render("client/cart", {
        title: "Your Order",
        user: "",
        cartTotal: "",
        cartShow: "",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

// exports.post_order = async (req, res, next) => {
//   try {
//     const { prodsId, quantity } = req.body;

//     console.log(prodsId);
//     // db.query(
//     //   "SELECT * FROM tblproduct WHERE prod_id IN (" + prodsId + ")",
//     //   function (err, rows) {
//     //     if (err) throw err;
//     //     console.log(rows);
//     //   }
//     // );
//   } catch (error) {
//     console.log(error);
//   }
// };

exports.delete_cart = (req, res) => {
  try {
    //deleting cart item
    db.query(
      "DELETE FROM tblcart WHERE prod_id = $1",
      [req.params.id],
      (error, cart) => {
        if (error) {
          console.log(error);
        } else {
          res.redirect("/sleekskincare/your-order");
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};

exports.update_cart = (req, res) => {
  try {
    //update cart item
    db.query(
      "UPDATE tblcart SET quantity = $1 WHERE prod_id = $2",
      [req.params.quantity, req.params.id],
      (error, cart) => {
        if (error) {
          console.log(error);
        } else {
          res.redirect("/sleekskincare/your-order");
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};
let orderss;

exports.post_cart = (req, res) => {
  try {
    const { ordersIdFromCart, amount } = req.body;
    orderss = ordersIdFromCart;
    if (!ordersIdFromCart) {
      res.send({ status: "null" });
    } else if (req.user.customer_position == "Distributor") {
      if (20000 > parseInt(amount)) {
        res.send({ status: "kulang" });
      } else {
        res.send({ status: "success" });
      }
    } else if (req.user.customer_position == "Seller") {
      if (5000 > parseInt(amount)) {
        res.send({ status: "kulang" });
      } else {
        res.send({ status: "success" });
      }
    } else {
      res.redirect("/sleekskincare/checkout");
    }
  } catch (error) {
    console.log(error);
  }
};

/*-- ========================== --*/

/*-- ======== Home Page ======= --*/

//Render The Home Page
exports.get_home = async (req, res) => {
  try {
    let resultedProdcuts = []
    const products = await prisma.tblproduct.findMany({
      where: {
        prod_status: "Active"
      },
      include: {
        tblratings: {
          select: {
            score: true
          }
        }
      }
    });

    products.forEach(product => {
      const Total_No_Of_Reviews = product.tblratings.length;
      let No_Of_Reviews = 0; 

      product.tblratings.forEach(prod => {
        No_Of_Reviews += prod.score;
      });

      product.No_Of_Reviews = No_Of_Reviews;
      product.Total_No_Of_Reviews = Total_No_Of_Reviews;

      resultedProdcuts.push(product);

    });

    const user = await prisma.tblcustomer.findMany({
      where: {
        customer_email: 'nathan@gmail.com'
      },
      include: {
        tblcart: true
      }
    })

    const reviews = await prisma.tblratings.findMany({
      include: {
        tblcustomer: {
          select: {
            customer_fname: true,
            customer_lname: true,
            customer_position: true
          }
        },
        tblproduct: {
          select: {
            prod_img: true
          }
        }
      }, 
      orderBy: {
        date_recorded: 'desc'
      }
    });
      
    if (req.user) {
      res.render("client/index", {
        title: "Home",
        user: req.user,
        products: resultedProdcuts,
        cartTotal: req.cart,
        reviews: reviews,
      });
    } else {
      // if there's no cookies exist. the home page will still render
      res.render("client/index", {
        title: "Home",
        user: "",
        products: resultedProdcuts,
        cartTotal: "",
        reviews: reviews,
      });
    }
          
  } catch (err) {
    console.log(err);
  }
};

exports.post_home = (req, res) => {
  const { search } = req.body;

  db.query(
    "SELECT * FROM tblproduct WHERE prod_name LIKE $1 OR prod_categories LIKE $1",
    ['%' + search + '%'],
    (err, result) => {
     
      if (req.user) {
        res.render("client/search", {
          title: "Search",
          user: req.user,
          products: result.rows,
          cartTotal: req.cart,
          searchValue: search,
        });
      } else {
        // if there's no cookies exist. the home page will still render
        res.render("client/search", {
          title: "Search",
          user: "",
          products: result.rows,
          cartTotal: "",
          searchValue: search,
        });
      }
    }
  );
};

/*-- ========================== --*/

/*-- ======== Search Page ======= --*/

exports.get_search = (req, res) => {
  db.query(
    "SELECT prod_id, prod_name, price, prod_img, prod_status, score, SUM(score) AS No_Of_Reviews, COUNT(*) AS Total_No_Of_Reviews FROM tblproduct JOIN tblratings ON tblproduct.prod_id = tblratings.prods_id GROUP BY tblratings.prods_id, prod_id, prod_name, price, prod_img, prod_status, score",
    (error, results) => {
      if (error) {
        console.log(error);
      } else {
        //if there's cookies exist. the home page will render some info of the user including their cart item
        if (req.user) {
          res.render("client/search", {
            title: "All Products",
            user: req.user,
            products: results.rows,
            cartTotal: req.cart,
          });
        } else {
          // if there's no cookies exist. the home page will still render
          res.render("client/search", {
            title: "All Products",
            user: "",
            products: results.rows,
            cartTotal: "",
          });
        }
      }
    }
  );
};
/*-- ========================== --*/

/*-- ======== Checkout Page ======= --*/

exports.get_checkout = (req, res) => {
  try {
    const products = orderss.split(',');
    let prod_ids = [];
    let params = [];
    products.map((id, i) => {
      prod_ids.push(parseInt(id));
      params.push('$' + (i+1));
    });

    db.query(
      `SELECT cart_id, tblproduct.prod_id, prod_name,prod_categories, price, prod_img, prod_qty, quantity FROM tblproduct JOIN tblcart ON tblproduct.prod_id = tblcart.prod_id WHERE cart_id IN (${params.join(',')})`,
      prod_ids,
      (error, insert) => {
        if (error) {
          console.log(error);
        } else {
          db.query(
            "Select * FROM tbladdress JOIN tblcustomer ON tbladdress.customer_id = tblcustomer.customer_id WHERE tbladdress.customer_id=$1",
            [req.user.customer_id],
            (error, allDefault) => {
              if (error) {
                console.log(error);
              } else {
                res.render("client/checkout", {
                  title: "Checkout",
                  user: req.user,
                  cartTotal: req.cart,
                  cartShow: insert.rows,
                  allDefault: allDefault.rows,
                });
              }
            }
          );
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};

exports.get_address = (req, res) => {
  db.query(
    "SELECT * FROM tbladdress WHERE customer_id=$1",
    [req.user.customer_id],
    (error, results) => {
      if (error) {
        console.log(error);
      } else {
        res.send({ results: results.rows });
      }
    }
  );
};

exports.post_checkout = (req, res) => {
  try {
    const {
      cartId,
      qty,
      message,
      receivedDate,
      radio,
      totalp,
      prodAmount,
      prodssId,
    } = req.body;

    function randomString(strlength) {
      let random_string = "";
      let chrac = "QWERTYUIOPASDFGHJKLZXCVBNM0123456789";
      for (let i = 0; i < strlength; i++) {
        random_string += chrac.charAt(Math.floor(Math.random() * chrac.length));
      }
      return random_string;
    }

    let orderID = randomString(15);
    let query;
    let values;

    if (typeof prodssId == "object") {
      let prod_ids = [];
      let params = [];
      prodssId.map((id, i) => {
        prod_ids.push(parseInt(id));
        params.push('$' + (i+1));
      });

      db.query(
        `DELETE FROM tblcart WHERE cart_id IN (${params.join(',')})`,
        prod_ids,
        (error, insert) => {
          if (error) {
            console.log(error);
          }
        }
      );
    } else {
      db.query(
        `DELETE FROM tblcart WHERE cart_id IN ($1)`,
        [prodssId],
        (error, insert) => {
          if (error) {
            console.log(error);
          }
        }
      );
    }
    db.query(
      "INSERT INTO tblorders (order_id, customer_id, total_amount) VALUES ($1, $2, $3)",
      [orderID, req.user.customer_id, totalp],
      (error, insert) => {
        if (error) {
          console.log(error);
        } else {
          if (typeof cartId == "object") {
            query =
              "INSERT INTO tblorderdetails (order_id, prod_id, quantity, prod_amount, message) VALUES ($1, $2, $3, $4, $5)";

            cartId.map((id, i) => {
              values = [orderID, cartId[i], qty[i], prodAmount[i], message];
              db.query(query, values),
              (error, insert) => {
                if (error) {
                  console.log(error);
                }
              };
            });
            
          } else {
            db.query(
              "INSERT INTO tblorderdetails (order_id, prod_id, quantity, prod_amount, message) VALUES ($1, $2, $3, $4, $5)",
              [orderID, cartId, qty, prodAmount, message],
              (error, insert) => {
                if (error) {
                  console.log(error);
                }
              }
            );
          }

          res.redirect("/sleekskincare/mypurchase");
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};

exports.post_address = (req, res) => {
  const {
    region,
    province,
    city,
    barangay,
    phonenumber,
    fullname,
    street,
    zipcode,
  } = req.body;
  if (
    !region ||
    !province ||
    !city ||
    !barangay ||
    !phonenumber ||
    !fullname ||
    !street ||
    !zipcode
  ) {
    res.send({ status: "err", msg: "All fields are required" });
  } else if (
    region == "Region" ||
    province == "Province" ||
    city == "City" ||
    barangay == "Barangay"
  ) {
    res.send({ status: "err", msg: "All fields are required" });
  } else {
    db.query(
      "INSERT INTO tbladdress (customer_id, fullname, phonenumber, region, province, city, barangay, zipcode, street) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [
        req.user.customer_id,
        fullname,
        phonenumber,
        region,
        province,
        city,
        barangay,
        zipcode,
        street,
      ],
      (error, insert) => {
        if (error) {
          console.log(error);
        } else {
          db.query(
            "Select * FROM tbladdress WHERE customer_id=$1",
            [req.user.customer_id],
            (error, body) => {
              if (error) {
                console.log(error);
              } else {
                res.send({
                  status: "success",
                  body: body.rows
                });
              }
            }
          );
        }
      }
    );
  }
};

/*-- ======== Payment Page ======= --*/
//Get
exports.get_payment = (req, res) => {
  res.render("client/payment", {
    title: "Payment",
    user: req.user,
    cartTotal: req.cart,
  });
};

/*-- ========================== --*/

/*-- ======== Account Page ======= --*/
//Get
exports.get_account = (req, res) => {
  res.render("client/account", {
    title: "My Account",
    user: req.user,
    cartTotal: req.cart,
  });
};

exports.post_account = async (req, res) => {
  const { fname, lname, area, email } = req.body;

  let prof_img;
  let uploadPath;
  prof_img = req.files.profile;
  //all the info that the user put from the input fields will insert to tblcustomer table
  if (!prof_img) {
    db.query(
      "UPDATE tblcustomer SET  customer_fname = $1, customer_lname= $2, customer_email = $3, customer_area = $4 WHERE customer_id= $5",
      [fname, lname, email, area, req.user.customer_id],
      (error, results) => {
        if (error) {
          console.log(error);
        } else {
          res.redirect("/sleekskincare/myaccount");
        }
      }
    );
  } else {
    //this will get the user profile and put it to the upload folder

    uploadPath = "upload/profiles/" + prof_img.name;

    prof_img.mv(uploadPath, function (err) {
      if (err) return res.status(500).send(err);
    });

    console.log(prof_img);

    db.query(
      "UPDATE tblcustomer SET  customer_fname = $1, customer_lname= $2, customer_email = $3, customer_area = $4, customer_img = $5 WHERE customer_id=$6",
      [fname, lname, email, area, prof_img.name, req.user.customer_id],
      (error, results) => {
        if (error) {
          console.log(error);
        } else {
          res.redirect("/sleekskincare/myaccount");
        }
      }
    );
  }
};

exports.post_valid = async (req, res) => {
  const { fname, lname, area, email, file1 } = req.body;
  if (
    fname == req.user.customer_fname &&
    lname == req.user.customer_lname &&
    area == req.user.customer_area &&
    email == req.user.customer_email &&
    !file1
  ) {
    res.send({ msg: "wala" });
  } else {
    res.send({ msg: "" });
  }
};
/*-- ========================== --*/

// "Select * FROM tblorders JOIN tblorderdetails ON tblorders.order_id = tblorderdetails.order_id JOIN tblproduct ON tblorderdetails.prod_id = tblproduct.prod_id WHERE customer_id=? ORDER BY tblorderdetails.created_at DESC",

/*-- ======== Purchase Page ======= --*/
//Get

exports.get_purchase = (req, res) => {
  db.query(
    "Select * FROM tblorders JOIN tblorderdetails ON tblorders.order_id = tblorderdetails.order_id JOIN tblproduct ON tblorderdetails.prod_id = tblproduct.prod_id WHERE customer_id=$1 ORDER BY tblorderdetails.created_at DESC",
    [req.user.customer_id],
    (error, insert) => {
      if (error) {
        console.log(error);
      } else {
        results = insert.rows.reduce(function (r, a) {
          r[a.order_id] = r[a.order_id] || [];
          r[a.order_id].push(a);
          return r;
        }, Object.create(insert.rows));

        res.render("client/purchase", {
          title: "My Purchase",
          user: req.user,
          cartTotal: req.cart,
          allOrders: results,
        });
      }
    }
  );
};

exports.post_purchase = (req, res) => {
  const { ords } = req.body;
  db.query(
    "UPDATE tblorders SET order_status = $1 WHERE order_id = $2",
    ["Cancelled", ords],
    (error, results) => {
      if (error) {
        console.log(error);
      } else {
        res.send({ status: "success" });
      }
    }
  );
};

exports.post_toship = (req, res) => {
  const { ords } = req.body;
  db.query(
    "UPDATE tblorders SET order_status = $1 WHERE order_id = $2",
    ["Cancelled", ords],
    (error, results) => {
      if (error) {
        console.log(error);
      } else {
        res.send({ status: "success" });
      }
    }
  );
};
exports.get_toship = (req, res) => {
  db.query(
    "Select * FROM tblorders JOIN tblorderdetails ON tblorders.order_id = tblorderdetails.order_id JOIN tblproduct ON tblorderdetails.prod_id = tblproduct.prod_id WHERE order_status=$1 AND customer_id=$2 ORDER BY tblorderdetails.created_at DESC",
    ["Pending", req.user.customer_id],
    (error, insert2) => {
      if (error) {
        console.log(error);
      } else {
        results2 = insert2.rows.reduce(function (r, a) {
          r[a.order_id] = r[a.order_id] || [];
          r[a.order_id].push(a);
          return r;
        }, Object.create(insert2.rows));

        res.render("client/toship", {
          title: "My Purchase",
          user: req.user,
          cartTotal: req.cart,
          allPending: results2,
        });
      }
    }
  );
};

exports.get_toreceive = (req, res) => {
  db.query(
    "Select * FROM tblorders JOIN tblorderdetails ON tblorders.order_id = tblorderdetails.order_id JOIN tblproduct ON tblorderdetails.prod_id = tblproduct.prod_id WHERE order_status=$1 AND customer_id=$2 ORDER BY tblorderdetails.created_at DESC",
    ["Accept", req.user.customer_id],
    (error, insert2) => {
      if (error) {
        console.log(error);
      } else {
        results2 = insert2.rows.reduce(function (r, a) {
          r[a.order_id] = r[a.order_id] || [];
          r[a.order_id].push(a);
          return r;
        }, Object.create(insert2.rows));

        res.render("client/toreceive", {
          title: "My Purchase",
          user: req.user,
          cartTotal: req.cart,
          allPending: results2,
        });
      }
    }
  );
};

exports.get_completed = (req, res) => {
  db.query(
    "Select * FROM tblorders JOIN tblorderdetails ON tblorders.order_id = tblorderdetails.order_id JOIN tblproduct ON tblorderdetails.prod_id = tblproduct.prod_id WHERE order_status=$1 AND customer_id=$2 ORDER BY tblorderdetails.created_at DESC",
    ["Completed", req.user.customer_id],
    (error, insert2) => {
      if (error) {
        console.log(error);
      } else {
        results2 = insert2.rows.reduce(function (r, a) {
          r[a.order_id] = r[a.order_id] || [];
          r[a.order_id].push(a);
          return r;
        }, Object.create(insert2.rows));

        res.render("client/completed", {
          title: "My Purchase",
          user: req.user,
          cartTotal: req.cart,
          allPending: results2,
        });
      }
    }
  );
};
exports.get_cancelled = (req, res) => {
  db.query(
    "Select * FROM tblorders JOIN tblorderdetails ON tblorders.order_id = tblorderdetails.order_id JOIN tblproduct ON tblorderdetails.prod_id = tblproduct.prod_id WHERE order_status=$1 AND customer_id=$2 ORDER BY tblorderdetails.created_at DESC",
    ["Cancelled", req.user.customer_id],
    (error, insert2) => {
      if (error) {
        console.log(error);
      } else {
        results2 = insert2.rows.reduce(function (r, a) {
          r[a.order_id] = r[a.order_id] || [];
          r[a.order_id].push(a);
          return r;
        }, Object.create(insert2.rows));

        res.render("client/cancelled", {
          title: "My Purchase",
          user: req.user,
          cartTotal: req.cart,
          allPending: results2,
        });
      }
    }
  );
};
/*-- ========================== --*/

/*-- ======== Logout ======= --*/
exports.get_logout = (req, res) => {
  res.cookie("jwt", "logout", {
    expires: new Date(Date.now() + 2 * 1000),
    httpOnly: true,
  });

  res.redirect("/sleekskincare/login");
};
/*-- ========================== --*/

/*-- ======== Check if there's cookies exist ======= --*/
exports.isLoggedIn = async (req, res, next) => {
  // See if there's someone currently log in
  if (req.cookies.jwt) {
    try {
      //1) verify the token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      //2) Check if the user still exists
      db.query(
        "SELECT * FROM tblcustomer WHERE customer_id = $1",
        [decoded.id],
        (error, result) => {
          if (!result) {
            //there is no user
            return next();
          }
          //get the user info
          req.user = result.rows[0];
          db.query(
            "SELECT cart_id, tblproduct.prod_id, prod_name, price, prod_img, prod_qty, quantity FROM tblproduct JOIN tblcart ON tblproduct.prod_id = tblcart.prod_id WHERE tblcart.customer_id = $1 ORDER BY cart_id DESC",
            [req.user.customer_id],
            async (error, resultsForCart) => {
              if (error) {
                console.log(error);
              } else {
                req.cart = resultsForCart.rows;
                return next();
              }
            }
          );
        }
      );
    } catch (error) {
      console.log(error);
      return next();
    }
  } else {
    next();
  }
};
/*-- ========================== --*/
