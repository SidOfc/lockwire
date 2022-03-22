import test from 'ava';
import {lockwire, relay} from '../src/index.js';

function sample(arr) {
    return arr[Math.ceil(Math.random() * arr.length) - 1];
}

function randomName() {
    return sample([
        'Bob',
        'Kara',
        'Norman',
        'Jenny',
        'Bas',
        'Anna',
        'Samuel',
        'Kim',
    ]);
}

function randomHobby() {
    return sample([
        'Golfing',
        'Gaming',
        'Writing',
        'Chess',
        'Snowboarding',
        'Climbing',
    ]);
}

function factory(amount = 10) {
    return lockwire({
        users: Array(amount)
            .fill()
            .map((_, id) => ({
                id,
                name: randomName(),
                hobbies: [{id, name: randomHobby()}],
            })),
        sortedUsers: relay({users: ['users']}, ({users}) =>
            [...users].sort((a, b) =>
                b.name > a.name ? -1 : b.name < a.name ? 1 : 0
            )
        ),
    });
}

test('update object property', (t) => {
    const api = factory();
    const newName = randomName();

    api.state.users[0].name = newName;

    t.is(api.state.users[0].name, newName);
});

test('update detached object property', (t) => {
    const api = factory();
    const user = sample(api.state.users);
    const newName = randomName();

    user.name = newName;

    t.is(user.name, newName);
    t.is(api.state.users.findBy({id: user.id}).name, newName);
});

test('update callback parameters', (t) => {
    const api = factory();
    const oldName = api.state.users[0].name;
    const newName = randomName();

    api.on('update', ({cursor, current, previous}) => {
        t.deepEqual(cursor, ['users', '0', 'name']);
        t.is(previous, oldName);
        t.is(current, newName);
    });

    api.state.users[0].name = newName;
});

test('update detached object property triggers callback', (t) => {
    const api = factory();
    const user = sample(api.state.users);

    api.on('update', t.pass);

    user.name = randomName();
});

test('relay cursor update object property', (t) => {
    const api = factory();
    const {id} = sample(api.state.sortedUsers);
    const newName = randomName();

    api.state.users.findBy({id}).name = newName;

    t.is(api.state.users.findBy({id}).name, newName);
});

test('relay cursor update callback parameters', (t) => {
    const api = factory();
    const {id} = sample(api.state.sortedUsers);
    const newName = randomName();

    api.on('update', ({cursor}) => t.deepEqual(cursor, ['sortedUsers']), [
        'sortedUsers',
    ]);

    api.state.sortedUsers.findBy({id}).name = newName;
});

test('relay cursor update also updates original cursors', (t) => {
    const api = factory();
    const {id} = sample(api.state.sortedUsers);
    const newName = randomName();

    t.plan(2);

    api.on('update', t.pass);

    api.state.sortedUsers.findBy({id}).name = newName;
});
