import express from 'express';
import React from 'react';
import Router from 'react-router';
import routes from '../../client/routes';
import ConfigManager from '../config';

let config = ConfigManager.config;

export default {
  frontend(middleware) {
    let expressRouter = express.Router();
    expressRouter.get('*', (req, res, next) => {
      let router = Router.create({location: req.url, routes: routes});
      router.run((Handler, state) => {
        var html = React.renderToString(<Handler />);
        return res.render('frontend', {
          body: html
        });
      });
    });
    
    return expressRouter;
  }
}