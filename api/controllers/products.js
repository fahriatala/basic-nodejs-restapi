const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Product = require('../models/product');
const rimRaf = require('rimraf');

exports.products_get_all = (req, res, next) => {
    const currentPagination = req.query.page || 1;
    const perPage = 5;
    let totalItems;
    let lastPage;
    Product.find()
        .countDocuments()
        // use select if only u need to show some data
        .select('name price _id productImage')
        // end of select
        .exec()
        .then(count => {
            totalItems = count;
            return Product.find()
            .skip((currentPagination - 1) * perPage)
            .limit(perPage)
        })
        .then(docs => {
            console.log(docs);
            if(docs.length > 0){
                // res.status(200).json(docs);
                if(Number(currentPagination) > 1){
                     lastPage =  'http://localhost:3000/products/?page=' + (Number(currentPagination)-1);
                } else{
                     lastPage = null;
                }
                const response = {
                    currentPage: 'http://localhost:3000/products/?page=' + (Number(currentPagination)),
                    nextPage: 'http://localhost:3000/products/?page=' + (Number(currentPagination)+1),
                    lastPages: lastPage,
                    count: docs.length,
                    totalProducts: totalItems,
                    // product: docs
                    products: docs.map(doc => {
                        if(doc.productImage) {
                            doc.productImage="http://localhost:3000/" + doc.productImage; 
                        }
                        return {
                            name: doc.name,
                            price: doc.price,
                            productImage: doc.productImage,
                            _id: doc._id,
                            request: {
                                type: 'GET',
                                url: 'http://localhost:3000/products/' + doc._id
                            }
                        }
                    })
                };
                res.status(200).json(response);
                // res.status(200).json({messsage: 'success', products:response, totalItems})
            } else {
                res.status(404).json({
                    message: 'No Entries'
                });
            }
            
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
}

exports.products_create_product = async (req, res, next) => {
    const name = req.body.name;
    const price = req.body.price;
    const productImage = req.file.path;
    const product = new Product({
        name: name,
        price: price,
        productImage: productImage
        });
    try{
       const result =  await product.save();
        res.status(201).json({
           message: 'Success Created Product',
           status: 'ok',
            createdProduct: {
                name: result.name,
                price: result.price,
                _id: result._id,
                request: {
                    type: 'GET',
                    url: "http://localhost:3000/products/" + result._id
                }
             }
       });
    //    return result;
    } catch (err){
        next(err);
        return err;
    }
}


exports.products_get_productId = (req, res, next) => {
    const id = req.params.productId;
    Product.findById(id)
        .select('name price _id productImage')
        .exec()
        .then(doc => {
            console.log("From Database",doc);
            if(doc){
                // res.status(200).json(doc);
                if(doc.productImage) {
                    doc.productImage="http://localhost:3000/" + doc.productImage; 
                }
                res.status(200).json({
                    product: doc,
                    request: {
                        type: 'GET',
                        url: 'http://localhost:3000/products'
                    }
                });
            } else {
                res.status(404).json({message: 'No valid Product Here'});
            }
            
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({error: err});
        });
}

exports.products_update_product = (req, res, next) => {
    const id = req.params.productId;
    const updateOps = {};
    for(const ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    Product.update({ _id: id}, { $set: updateOps })
        .exec()
        .then(result => {
            console.log(result);
            // res.status(200).json(result);
            res.status(200).json({
                message: 'Product Updated',
                request: {
                    type: 'GET',
                    url: 'http://localhost:3000/products/' + id
                }
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
}

exports.products_delete = async (req, res, next) => {
    try{
        const id = req.params.productId;
        const checkImage = await Product.findOne({ _id: id });
        rimRaf(checkImage.productImage, function(err) {
            if (err){
                throw(err);
            }
        });
        await Product.remove({ _id: id });
        res.status(200).json({
            message: 'Product Deleted',
            request: {
                type: 'POST',
                url: 'http://localhost:3000/products',
                body: { name: 'String', price: 'Number' }
            }
        });
      } catch(err){
        return res.send(err);
      }
}