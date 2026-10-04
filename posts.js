const express = require('express');

const Post = require('../models/Post');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const posts =
      await Post.find()
        .populate('author', 'name')
        .sort({ createdAt: -1 })
        .limit(12);

    res.json({
      posts
    });
  } catch (error) {
    next(error);
  }
});

router.get(
  '/mine',
  requireAuth,
  async (req, res, next) => {
    try {
      const posts =
        await Post.find({
          author: req.userId
        }).sort({ createdAt: -1 });

      res.json({
        posts
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/',
  requireAuth,
  async (req, res, next) => {
    try {
      const title =
        String(req.body.title || '').trim();

      const category =
        String(
          req.body.category || 'General'
        ).trim() || 'General';

      const content =
        String(req.body.content || '').trim();

      if (
        title.length < 3 ||
        content.length < 20
      ) {
        return res.status(400).json({
          message:
            'Title must be 3+ characters and content must be 20+ characters.'
        });
      }

      const post = await Post.create({
        title,
        category,
        content,
        author: req.userId
      });

      const populatedPost =
        await post.populate(
          'author',
          'name'
        );

      res.status(201).json({
        message: 'Post published.',
        post: populatedPost
      });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id',
  requireAuth,
  async (req, res, next) => {
    try {
      const title =
        String(req.body.title || '').trim();

      const category =
        String(
          req.body.category || 'General'
        ).trim() || 'General';

      const content =
        String(req.body.content || '').trim();

      if (
        title.length < 3 ||
        content.length < 20
      ) {
        return res.status(400).json({
          message:
            'Title must be 3+ characters and content must be 20+ characters.'
        });
      }

      const post =
        await Post.findOneAndUpdate(
          {
            _id: req.params.id,
            author: req.userId
          },
          {
            title,
            category,
            content
          },
          {
            new: true,
            runValidators: true
          }
        ).populate('author', 'name');

      if (!post) {
        return res.status(404).json({
          message:
            'Post not found or you do not have permission to edit it.'
        });
      }

      res.json({
        message: 'Post updated.',
        post
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:id',
  requireAuth,
  async (req, res, next) => {
    try {
      const post =
        await Post.findOneAndDelete({
          _id: req.params.id,
          author: req.userId
        });

      if (!post) {
        return res.status(404).json({
          message:
            'Post not found or you do not have permission to delete it.'
        });
      }

      res.json({
        message:
          'Post deleted successfully.'
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;