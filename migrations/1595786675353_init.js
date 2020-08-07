/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.createTable('logs', {
        id: 'id',
        text:  {
            type: 'varchar(1000)',
            notNull: true
        },
        createdAt: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    })
};

exports.down = pgm => {};
