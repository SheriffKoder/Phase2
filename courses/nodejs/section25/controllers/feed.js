
//(25.2.2)
const fs = require("fs");
const path = require("path");

//(24.0.4)
const {validationResult} = require("express-validator");

//(25.0.6)
const Post = require("../models/post");


//(24.0.2)
exports.getPosts = (req, res, next) => {

    //(25.1.1)
    Post.find()
	.then((posts) => {
        res.status(200).json({message: "fetched posts successfully", posts: posts});
    })
	.catch((err) => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);  //async error handling         //(25.0.8)
	})


    //json is a method provided by express js
    //to return a response with json data
    //with the right headers being set
    //we can pass a js object and will be transformed to a json
    //and sent back to the client who sent the request
    //with sending json response we send the status code, 200 is the default
    //because the client will render the user interface based on the response
    //especially error codes are important to pass back to the client
    //the user will decide what to render based on the status code received
    //(24.0.3)
    //-(25.1.1)
    /*
    res.status(200).json({
        posts: 
        [
            {
                //(25.0.2) 
                _id: "001",
                title: "first post",
                content: "this is the first post",
                imageUrl: "images/image.png",
                creator: {
                    name: "Max"
                },
                createdAt: new Date()
            }
        ]
    });
    */

};


//our response here will be a json response
//or a json response depending on the input

//we expect the client to interact with us with json data, as we return json data

//(24.0.3)
//POST controller to /feed/post
exports.createPost = (req, res, next) => {

    //expect to get a title from the incoming request

    //(24.0.4) validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {

        //(25.0.8)
        const error = new Error("Validation failed, entered data is incorrect");
        error.statusCode = 422; //custom property, custom name
        throw error;

        /*
        return res.status(422).json({
            message: "Validation failed, entered data is incorrect",
            errors: errors.array()
        })
        */
    }

    //(25.2.0) if multer is not able to extract the file
    if (!req.file) {
        const error = new Error("no image provided");
        //as it is a kind of a validation error
        error.statusCode = 422;
        throw error;

    }

    //the path is generated by multer as it was stored on the server
    const imageUrl = req.file.path //(25.2.0)
    const title = req.body.title;
    const content = req.body.content;

    //(25.0.6)
    //we do not need to set createdAt
    //as mongoose will do that using the timestamp in the model
    //and _id will be created automatically as well
    const post = new Post({
        title: title,
        content: content,
        //imageUrl: "images/image.png", //-(25.2.0)
        imageUrl: imageUrl,             //(25.2.0)
        creator: {name: "max"}
    });
    
    post.save()
    .then((result) => {
		console.log(result);
        res.status(201).json({
            message: "Post created successfully!",
            post: result
	    })
    })
	.catch((err) => {
		//console.log(err);         //-(25.0.8)
        //(25.0.8)
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);  //async error handling         //(25.0.8)
	})


    //create post in db
    //-(25.0.6)
    //status 201 as we created a resource
    /*
    res.status(201).json({
        message: "Post created successfully!",
        //post data i want to parse from the incoming request
        //id should be created automatically by mongoDB
        //but we will create a dummy here as not used the db yet
        post: {
            _id: new Date().toISOString, 
            title: title,
            content: content,  //-(25.0.6)
            creator: {
                name: "max"
            },
            createdAt: new Date()
            
        }
    });
    */

}


//(25.1.0)
exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    //find a post with that id in the database
    Post.findById(postId)
    .then((post) => {
        if (!post) {
            const error = new Error("Could not find post");
            //if you throw an error inside a then block
            //the next catch block will be reached
            //and the error will be passed as an error to the catch block
            error.statusCode = 404;
            throw error;
        }

        //if we find the post
        //will return a response with a status,
        res.status(200).json({message: "Post fetched", post: post}); 

    })
	.catch((err) => {
        //(25.0.8)
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);  //async error handling         //(25.0.8)
	})

}


//(25.2.1)
// PUT to /feed/post
exports.updatePost = (req, res, next) => {
    const postId = req.params.postId;

    //(24.0.4) validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {

        //(25.0.8)
        const error = new Error("Validation failed, entered data is incorrect");
        error.statusCode = 422; //custom property, custom name
        throw error;

        /*
        return res.status(422).json({
            message: "Validation failed, entered data is incorrect",
            errors: errors.array()
        })
        */
    }

    const title = req.body.title;
    const content = req.body.content;    

    //for the image url we have two options
    //1. it can be part of the request body 
    //that is the case if no new file was added
    //the frontend code has the logic to take the existing url and keep it
    let imageUrl = req.body.image;
    //2. you might have picked a file
    if (req.file) {
        imageUrl = req.file.path;
    }

    //not extracted, 
    if (!imageUrl) {
        const error = new Error("No file picked");
        error.statusCode = 422;
        throw error;
    }


    //here i can know i have valid data
    //and now can update it in the database

    Post.findById(postId)
    .then((post) => {
        if (!post) {
            const error = new Error("Could not find post");
            //if you throw an error inside a then block
            //the next catch block will be reached
            //and the error will be passed as an error to the catch block
            error.statusCode = 404;
            throw error;
        }

        //(25.2.2)
        if (imageUrl !== post.imageUrl) {
            clearImage(post.imageUrl);
        }



        //found a post
        post.title = title;
        post.imageUrl = imageUrl;
        post.content = content;
        //overwriting the old post but keeping the old id
        return post.save();

    })
    .then(result => {
        //we did not create a new resource so it is not 201
        res.status(200).json({
            message: "Post updated",
            post: result
        });
    })
	.catch((err) => {
        //(25.0.8)
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);  //async error handling         //(25.0.8)
	})
}


//(25.2.2)
//want to trigger the clearImage function
//whenever uploaded a new image
const clearImage = (filePath) => {
   
    //up one folder as we are in the controllers folder now
    filePath = path.join(__dirname, "..", filePath)
    fs.unlink(filePath, err => console.log(err));

}