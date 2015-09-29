import Promise from 'bluebird';

export default function sequence(tasks) {
  return Promise.reduce(tasks, (results, task) => {
    return task().then((result) => {
      results.push(result);
      
      return results;
    });
  }, []);
}