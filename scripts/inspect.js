import {lockwire} from '../src/index.js';

const api = lockwire({
    users: [
        {id: 1, name: 'Bas', hobbies: [{id: 1, name: 'Golfing'}]},
        {id: 2, name: 'Bob', hobbies: [{id: 2, name: 'Gaming'}]},
        {id: 3, name: 'Sam', hobbies: [{id: 3, name: 'Writing'}]},
        {id: 4, name: 'Kim', hobbies: [{id: 4, name: 'Chess'}]},
    ],
});

api.on('update', console.log, []);

api.state.users.findBy({id: 3}).name = 'Kor';
api.state.users.findBy({id: 2}).hobbies.push({id: 5, name: 'Fletching'});
api.state.users.findBy({id: 2}).hobbies.findBy({name: 'Fletching'}).name =
    'Crafting';

api.state.settings = {};

Object.assign(api.state.settings, {admin: true, active: true});

console.log(api.state.users);
