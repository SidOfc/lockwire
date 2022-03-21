import * as defaultExtensions from './extensions.js';

export function lockwire(data) {
    const events = {};
    const extensions = {...defaultExtensions};
    const api = {};

    api.on = (event, callback, cursor = []) => {
        events[event] ||= [];
        events[event].unshift({cursor: cursor.map(String), callback});
    };

    api.after = (event, callback, cursor = []) => {
        events[event] ||= [];
        events[event].push({cursor: cursor.map(String), callback});
    };

    api.off = (event, callback) => {
        if (events[event]) {
            events[event] = events[event].filter(
                ({callback}) => other !== callback
            );
        }
    };

    api.register = (payload) => {
        events[payload.event]?.forEach(({cursor, callback}) => {
            if (cursor.every((node, idx) => node === payload.cursor[idx]))
                callback(payload);
        });
    };

    api.extensions = extensions;
    api.state = proxy(data, api, []);

    return api;
}

export function relay(cursors, callback) {
    const cache = {};
    const relayInitializer = (api, relayCursor) => {
        const relayGetter = () => {
            if (cache.value) return cache.value;

            const stateCursors = Object.entries(cursors).reduce(
                (state, [name, cursor]) => {
                    state[name] = cursor.reduce(
                        (target, property) => target?.[property],
                        api.state
                    );

                    return state;
                },
                {}
            );

            const value = callback(stateCursors);

            return (cache.value =
                value === Object(value)
                    ? proxy(value, {...api, register: noop}, relayCursor)
                    : value);
        };

        const relayUpdater = () => {
            delete cache.value;

            api.register({
                type: 'relay',
                event: 'update',
                cursor: relayCursor,
                current: relayGetter(),
            });
        };

        Object.values(cursors).forEach((cursor) =>
            api.after('update', relayUpdater, cursor)
        );

        relayGetter.isLockwireRelayGetter = true;

        return relayGetter;
    };

    relayInitializer.isLockwireRelayInitializer = true;

    return relayInitializer;
}

function proxy(value, api = {}, cursor = []) {
    return new Proxy(value, {
        get: getter(api, cursor),
        set: setter(api, cursor),
    });
}

function getter(api, cursor) {
    return (target, key, targetProxy) => {
        if (typeof api.extensions[key] === 'function')
            return api.extensions[key].bind({target, targetProxy, cursor});

        if (isRelayInitializer(target[key]))
            target[key] = target[key](api, [...cursor, key]);

        if (isRelayGetter(target[key])) return target[key]();

        if (typeof target[key] === 'function')
            return target[key].bind(targetProxy);

        if (target[key] === Object(target[key]))
            return proxy(target[key], api, [...cursor, key]);

        return target[key];
    };
}

function setter(api, cursor) {
    return (target, key, value, targetProxy) => {
        if (isRelay(target[key]))
            throw new Error('lockwire::relay is read-only.');

        if (isRelay(value))
            throw new Error(
                'lockwire::relay may only be set during initialization.'
            );

        const previous = target[key];
        target[key] = value;

        if (!(key === 'length' && Array.isArray(target))) {
            api.register({
                type: 'regular',
                event: 'update',
                cursor: [...cursor, key],
                current: value,
                previous,
            });
        }

        return true;
    };
}

function isRelay(value) {
    return isRelayInitializer(value) || isRelayGetter(value);
}

function isRelayInitializer(value) {
    return value?.isLockwireRelayInitializer;
}

function isRelayGetter(value) {
    return value?.isLockwireRelayGetter;
}

function noop() {}
