import pipeline from './utils/pipeline';
import Promise from 'bluebird';
import _ from 'lodash';

/**
 * Default Values
 * A hash of default values to use instead of 'magic' numbers/strings.
 * @type {Object}
 */
let defaults = {
  filterPriority: 5,
  maxPriority: 9
};

export class Filters {
  constructor() {
    // Holds the filters
    this.filterCallbacks = [];
    
    // Holds the filter hooks
    this.filters = [];
  }
  
  // Register a new filter callback function
  registerFilter(name, priority, fn) {
    // Carry the priority optional parameter to a default of 5
    if (_.isFunction(priority)) {
      fn = priority;
      priority = null;
    }
    
    // Null priority should be set to default
    if (priority === null) {
      priority = defaults.filterPriority;
    }
    
    this.filterCallbacks[name] = this.filterCallbacks[name] || {};
    this.filterCallbacks[name][priority] = this.filterCallbacks[name][priority] || [];
    
    this.filterCallbacks[name][priority].push(fn);
  }
  
  // Unregister a filter callback function
  deregisterFilter(name, priority, fn) {
    // Carry the priority optional parameter to a default of 5
    if (_.isFunction(priority)) {
      fn = priority;
      priority = defaults.filterPriority;
    }
    
    // Check if it even exists
    if (this.filterCallbacks[name] && this.filterCallbacks[name][priority]) {
      // Remove the function from the list of filter funcs
      this.filterCallbacks[name][priority] = _.without(this.filterCallbacks[name][priority], fn);
    }
  }
  
  // Execute filter functions in priority order
  doFilter(name, args, context) {
    let callbacks = this.filterCallbacks[name];
    let priorityCallbacks = [];
    
    // Bug out early if no callbacks by that name
    if (!callbacks) {
      return Promise.resolve(args);
    }
    
    // For each priorityLevel
    _.times(defaults.maxPriority + 1, (priority) => {
      // Add a function that runs its priority level callbacks in a pipeline
      priorityCallbacks.push((currentArgs) => {
        let callables;
        
        // Bug out if no handlers on this priority
        if (!_.isArray(callbacks[priority])) {
          return Promise.resolve(currentArgs);
        }
        
        callables = _.map(callbacks[priority], (callback) => {
          return (args) => {
            return callback(args, context);
          };
        });
        
        // Call each handler for this priority level, allowing for promises or values
        return pipeline(callables, currentArgs);
      });
    });
    
    return pipeline(priorityCallbacks, args);
  }
}
