/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.addColumns('logs', {
        via:  {
            type: 'varchar(256)',
            notNull: false
        },
    })
};

exports.down = pgm => {};
