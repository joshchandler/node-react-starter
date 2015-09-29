import Promise from 'bluebird';

export default function pipeline(tasks /* initial arguments */) {
  let args = Array.prototype.slice.call(arguments, 1);
  let runTask = (task, args) => {
    runTask = (task, arg) => {
      return task(arg);
    };
    
    return task.apply(null, args);
  };
  
  return Promise.all(tasks).reduce((arg, task) => {
    return Promise.resolve(runTask(task, arg)).then((result) => {
      return result;
    });
  }, args);
}