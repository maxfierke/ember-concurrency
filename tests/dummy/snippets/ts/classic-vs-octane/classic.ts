import Component from '@ember/component';
import { task, timeout } from 'ember-concurrency';

export default Component.extend({
  myTask: task(function * (ms: number) {
    yield timeout(ms);
    return 'done!';
  }),

  performTask() {
    this.get('myTask').perform(1000).then(value => {
      console.log(value.toUpperCase());
    });
  }
});
