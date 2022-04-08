const { Plugin } = require('powercord/entities');
const {
    getModule,
    getModuleByDisplayName,
    React,
    Flux
} = require("powercord/webpack");
const { inject, uninject } = require('powercord/injector');

module.exports = class WPMPlugin extends Plugin {
    start = 0;

    resetTime() {
        this.start = new Date().getTime();
    }

    timeSinceReset() {
        return (new Date().getTime() - this.start) / 1000 / 60;
    }

    async startPlugin() {
        this.loadStylesheet('style.css');

        this.resetTime();
        // from https://github.com/Inve1951/BetterDiscordStuff/blob/master/plugins/CharacterCounter.plugin.js

        const channelStore = await getModule(["hasChannel", "getChannel"]);
        const channelIdStore = await getModule(["getChannelId", "getLastSelectedChannelId"]);

        const WPM = Flux.connectStores([channelIdStore], (props) => {
            const channel = channelStore.getChannel(channelIdStore.getChannelId());
            props.rateLimitPerUser = channel.rateLimitPerUser;
            return props;
        })(({ initValue, rateLimitPerUser }) => {
            const [value, setValue] = React.useState(initValue || "");
            this.setValue = setValue;

            if (value.trim().length < 2) {
                // reset time at zero or one character
                this.resetTime();
            }

            const right = rateLimitPerUser ? 360 : 16;
            const wpm = value.split(" ").length / this.timeSinceReset();
            return React.createElement(
                "span",
                {
                    id: "wpm-indicator-text",
                    style: {
                        right
                    }
                },
                `${isFinite(wpm) ? Math.floor(wpm) : 0} WPM`
            );
        });

        const ChannelEditorContainer = await getModuleByDisplayName('ChannelEditorContainer');

        inject('wpm-hook', ChannelEditorContainer.prototype, 'render', (args, res) => {
            setTimeout(() => {
                const text = document.querySelector('[data-slate-editor="true"]')?.innerText;
                if (text && this.setValue) {
                    this.setValue(text);
                }
            });
            return res;
        });

        const TypingUsers = await getModule(m => m.default && m.default.displayName === 'FluxContainer(TypingUsers)');

        inject('wpm-indicator', TypingUsers.default.prototype, 'render', (args, res) => React.createElement(
            React.Fragment, null, res, React.createElement(WPM, { initValue: document.querySelector('[data-slate-editor="true"]')?.innerText })
        ));
    }

    pluginWillUnload() {
        uninject('wpm-indicator');
        uninject('wpm-hook');
    }
};
