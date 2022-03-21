import {lockwire, relay} from '../src/index.js';

const api = lockwire({
    users: [
        {id: 1, name: 'Bas', hobbies: [{id: 1, name: 'Golfing'}]},
        {id: 2, name: 'Bob', hobbies: [{id: 2, name: 'Gaming'}]},
        {id: 3, name: 'Sam', hobbies: [{id: 3, name: 'Writing'}]},
        {id: 4, name: 'Kim', hobbies: [{id: 4, name: 'Chess'}]},
    ],
    sortedUsers: relay({users: ['users']}, ({users}) =>
        [...users].sort((a, b) =>
            b.name > a.name ? -1 : b.name < a.name ? 1 : 0
        )
    ),
});

api.on('update', console.log);

api.state.sortedUsers.findBy({id: 1}).name = 'Zorro';
