import _ from 'lodash';

export default function cacheControl(options) {
  let profiles = {
    public: 'public, max-age=0',
    private: 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0'
  };
  let output;
  
  if (_.isString(options) && profiles.hasOwnProperty(options)) {
    output = profiles[options];
  }
  
  return function cacheControlHeaders(req, res, next) {
    if (output) {
      if (res.isPrivate) {
        res.set({'Cache-Control': profiles['private']});
      } else {
        res.set({'Cache-Control': output});
      }
    }
    next();
  };
}