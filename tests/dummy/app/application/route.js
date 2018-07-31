import Route from '@ember/routing/route';
import { inject } from '@ember/service';
import Ember from 'ember';

export default Route.extend({
  fastboot: inject(),

  beforeModel() {
    if (!Ember.testing && !this.get('fastboot.isFastBoot')) {
      this._router.on('didTransition', () => {
        window.scrollTo(0,0);
      });
    }
  }
});
