import Component from '@ember/component';

// BEGIN-SNIPPET increment-button.js
function sendPress() {
  this.sendAction('press');
}

function sendRelease() {
  this.sendAction('release');
}

export default Component.extend({
  tagName: 'button',

  touchStart: sendPress,
  mouseDown:  sendPress,
  touchEnd:   sendRelease,
  mouseLeave: sendRelease,
  mouseUp:    sendRelease,
});
// END-SNIPPET

