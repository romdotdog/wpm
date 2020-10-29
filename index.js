const { Plugin } = require('powercord/entities');
// const { findInReactTree } = require('powercord/util');
const { getModule, getModuleByDisplayName, React } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');

/* First public plugin soooo... bad code lol */

let start = 0; // facepalm.. please don't look at previous commit.

function resetTime () {
  start = new Date().getTime();
}

function delta () {
  return (new Date().getTime() - start) / 1000 / 60;
}

module.exports = class WPM extends Plugin {
  async startPlugin () {
    this.loadStylesheet('style.css');

    resetTime();
    let setValue;

    // Credits to https://github.com/Inve1951/BetterDiscordStuff/blob/master/plugins/CharacterCounter.plugin.js
    const WPM = function ({ init_value }) {
      const [ value, sv ] = React.useState(init_value || '');
      setValue = sv;

      if (value.trim().length < 2) { // reset time at zero or one character
        resetTime();
      }

      const _wpm = value.split(' ').length / delta(); // length / 5 / delta(); -- actual words was unexpectedly widely requested
      return React.createElement(
        'span', { id: 'wpm-indicator-text' }, `${isFinite(_wpm) ? Math.floor(_wpm) : 0} WPM`
      );
    };

    const SlateChannelTextArea = await getModuleByDisplayName('SlateChannelTextArea');

    inject('wpm-hook', SlateChannelTextArea.prototype, 'render', (args, res) => {
      setTimeout(() => {
        const ta = document.querySelector('[data-slate-editor="true"]')?.innerText;
        if (ta && setValue) {
          setValue(ta);
        }
      });
      return res;
    });

    const TypingUsers = await getModule(m => m.default && m.default.displayName === 'FluxContainer(TypingUsers)');

    inject('wpm-indicator', TypingUsers.default.prototype, 'render', (args, res) => React.createElement(
      React.Fragment, null, res, React.createElement(WPM, { init_value: document.querySelector('[data-slate-editor="true"]')?.innerText })
    ));
  }

  pluginWillUnload () {
    uninject('wpm-indicator');
    uninject('wpm-hook');
  }
};
