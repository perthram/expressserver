const express = require('express');
const router = express.Router();
const passport = require('passport');

//Load Post Model
const Post = require('../../models/Post');
//Load Profile Model
const Profile = require('../../models/Profile');

//Validation
const validatePostInput = require('../../validations/post');

//@route GET api/posts/test
//@desc Tests Posts route
//@access Public
router.get('/test', (req, res) => res.json({ msg: 'Posts Works' }));

//@route GET api/posts
//@desc Get Post
//@access Public
router.get('/', (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => res.json(posts))
    .catch(() => res.status(404).json({ nopostsfound: 'No posts found' }));
});

//@route GET api/posts/:id
//@desc Get post by id
//@access Public
router.get('/:id', (req, res) => {
  Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(() =>
      res.status(404).json({ nopostfound: 'No post found with that ID' })
    );
});

//@route POST api/posts
//@desc Create Post
//@access Private
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    //Check Validation
    if (!isValid) {
      return res.status(400).json(errors);
    }
    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id,
    });

    newPost.save().then(post => res.json(post));
  }
);

//@route DELETE api/posts/:id
//@desc Delete Post
//@access Private

router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        Post.findById(req.params.id).then(post => {
          //Check for post owner
          if (post.user.toString() !== req.user.id) {
            return res
              .status(401)
              .json({ notauthorized: 'User not authorized' });
          }

          //Delete
          post
            .remove()
            .then(() => res.json({ success: true }))
            .catch(() =>
              res.status(404).json({ postnotfound: 'No post found' })
            );
        });
      })
      .catch(() =>
        res.status(401).json({ notauthorized: 'User not authorized' })
      );
  }
);

//@route POST api/posts/like:id
//@desc Like post
//@access Private

router.post(
  '/like/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        Post.findById(req.params.id).then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length > 0
          ) {
            return res
              .status(400)
              .json({ alreadylike: 'User already liked this post' });
          }
          //Add the user id to likes array
          post.likes.unshift({ user: req.user.id });

          post.save().then(post => res.json(post));
        });
      })
      .catch(() =>
        res.status(401).json({ notauthorized: 'User not authorized' })
      );
  }
);

//@route POST api/posts/unlike:id
//@desc Unike post
//@access Private

router.post(
  '/unlike/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        Post.findById(req.params.id).then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length === 0
          ) {
            return res
              .status(400)
              .json({ notliked: 'You have not yet liked this post' });
          }
          //Get remove index
          const removeIndex = post.likes.findIndex(
            item => item.user.toString() === req.user.id
          );

          if (removeIndex > -1) {
            post.likes.splice(removeIndex, 1);
            post.save().then(post => res.json(post));
          } else {
            return res
              .status(400)
              .json({ notliked: 'You have not yet liked this post' });
          }
        });
      })
      .catch(() =>
        res.status(401).json({ notauthorized: 'User not authorized' })
      );
  }
);

//@route POST api/posts/comment:id
//@desc Add a comment to post
//@access Private
router.post(
  '/comment/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    //Check Validation
    if (!isValid) {
      return res.status(400).json(errors);
    }

    Post.findById(req.params.id)
      .then(post => {
        const newComment = {
          text: req.body.text,
          name: req.body.name,
          avatar: req.body.avatar,
          user: req.user.id,
        };
        //Add to comments array
        post.comments.unshift(newComment);

        //Save
        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
  }
);

//@route DELETE api/posts/comment/:id/:comment_id
//@desc Remove a comment to post
//@access Private
router.delete(
  '/comment/:id/:comment_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Post.findById(req.params.id)
      .then(post => {
        //Check to see if comment exists
        if (
          post.comments.filter(
            comment => comment._id.toString() === req.params.comment_id
          ).length === 0
        ) {
          return res
            .status(404)
            .json({ commentnotexists: 'Comment does not exists' });
        }

        //Get remove index
        const removeIndex = post.comments.findIndex(
          item => item._id.toString() === req.params.comment_id
        );

        //Splice comment out of array
        if (removeIndex > -1) {
          post.comments.splice(removeIndex, 1);
          post.save().then(post => res.json(post));
        } else {
          return res
            .status(404)
            .json({ commentnotexists: 'Comment does not exists' });
        }
      })
      .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
  }
);
module.exports = router;
