const { Plugin } = require('powercord/entities');
// const { findInReactTree } = require('powercord/util');
const { getModule, getModuleByDisplayName, React } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');

/* First public plugin soooo... bad code lol */

function resetTime() {
  this.start = new Date().getTime();
}

function delta() {
  return (new Date().getTime() - this.start) / 1000 / 60;
}

module.exports = class WPM extends Plugin {
  async startPlugin () {
    this.loadStylesheet('style.css');

    this.start = 0;
    let setLength;
    // Credits to https://github.com/Inve1951/BetterDiscordStuff/blob/master/plugins/CharacterCounter.plugin.js
    const WPM = function ({ value }) {
      let init = 0;
      if (value) {
        init = value.trim().length;
      }
      const [ length, sl ] = React.useState(init);
      setLength = sl;

      if (length === 0) {
        resetTime();
      }
      const _wpm = length / 5 / delta();
      return React.createElement(
        'span', { id: 'pc-wpm' }, `${isNaN(_wpm) ? 0 : Math.floor(_wpm)} WPM`
      );
    };

    const SlateChannelTextArea = await getModuleByDisplayName('SlateChannelTextArea');

    inject('wpm-hook', SlateChannelTextArea.prototype, 'render', (args, res) => {
      setTimeout(() => {
        const ta = document.querySelector('[data-slate-editor="true"]')?.innerText;
        if (ta && setLength) {
          setLength(ta.trim().length);
        }
      });
      return res;
    });

    const TypingUsers = await getModule(m => m.default && m.default.displayName === 'FluxContainer(TypingUsers)');

    inject('wpm-indicator', TypingUsers.default.prototype, 'render', (args, res) => React.createElement(
      React.Fragment, null, res, React.createElement(WPM, { value: document.querySelector('[data-slate-editor="true"]')?.innerText })
    ));
  }

  pluginWillUnload () {
    uninject('wpm-indicator');
    uninject('wpm-hook');
  }
};
