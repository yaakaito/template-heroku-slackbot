import express, { NextFunction, Request, Response, urlencoded } from 'express'
import { withMiddlewares } from './middlewares'
import { pool } from './db/driver'
import { WebClient } from '@slack/web-api'
import { createMessageAdapter } from '@slack/interactive-messages'

const port =  process.env.PORT || 11000
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN ?? ''

const actionsAdapter = createMessageAdapter(process.env.SLACK_SIGNING_SECRET!)

const app = withMiddlewares(express())
app.get('/', (request, response, next) => {
    (async () => {
        const client = await pool.connect()
        const { rows } = await client.query('select * from logs')
        response.send({
            rows
        })
    })().catch(next)
})


app.get('/echo', (request, response, next) => {
    (async () => {
        const text = request.query.text as string
        const client = new WebClient(SLACK_BOT_TOKEN)
        await client.chat.postMessage({
            channel: '#dev_null',
            text
        })
        response.send({})
    })().catch(next)
})

let buttonState = {
    ts: null as null | string,
    channel: null as null | string,
    calls: 0,
    checks: [false, false, false]
}

const blocks = () =>  [
    {
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": "checkboxes"
        },
        "accessory": {
            "type": "overflow",
            "options": [
                {
                    "text": {
                        "type": "plain_text",
                        "text": "checks all",
                        "emoji": true
                    },
                    "value": "all",
                }
            ],
            "action_id": "check_all"
        }
    },
    ...buttonState.checks.map((value, index) => {
        const base = {
            type: 'section',
        }
        if (value) {
            return {
                ...base,
                text: {
                    type: 'mrkdwn',
                    text: `:white_check_mark: item(${index})`
                }
            }
        }

        return {
            ...base,
            text: {
                type: 'mrkdwn',
                text: `item(${index})`
            },
            accessory: {
                type: 'button',
                text: {
                    type: "plain_text",
                    text: "check",
                    emoji: true
                },
                value: `item_${index}`,
                action_id: `check_button_${index}`
            }
        }
    })
]

const postOrUpdate = async () => {
    const client = new WebClient(SLACK_BOT_TOKEN)
    const { ts, channel } = await (buttonState.ts ? client.chat.update : client.chat.postMessage)({
        channel: buttonState.channel ?? '#dev_null',
        text: `buttons called(${buttonState.calls++})`,
        attachments: [
            {
                color: buttonState.checks.every(v => v) ? '#00ff00' : '#cccccc',
                blocks: blocks()
            }
        ],
        // @ts-expect-error
        ts: buttonState.ts
    })
    if (typeof ts === 'string') {
        buttonState.ts = ts
    }
    if (typeof channel === 'string') {
        buttonState.channel = channel
    }
}
app.get('/buttons', (request, response, next) => {
    (async () => {
        await postOrUpdate()
        response.send({})
    })().catch(next)
})

actionsAdapter.action({ actionId:/^check_button_[0-9]+$/}, (payload, respond) => {
    try {
        const action = payload.actions[0]
        const [,,index] = action.action_id.split('_')
        buttonState.checks[Number(index)] = true
        postOrUpdate()
        return {
            text: 'hi'
        }
    } catch(e) {
        console.error(e)
        respond({
            text: 'error'
        })
    }
})
actionsAdapter.action({ actionId:'check_all'}, (payload, respond) => {
    buttonState.checks = buttonState.checks.map(v => true)
    postOrUpdate()
    return {
        text: 'hi'
    }
})
app.use('/actions', actionsAdapter.expressMiddleware())

app.use('/slash', urlencoded({
    extended: false,
    type: 'application/x-www-form-urlencoded'
}))

app.post('/slash', (request, response, next) => {
    (async () => {
        const { text } = request.body
        const client = new WebClient(SLACK_BOT_TOKEN)
        await client.chat.postMessage({
            channel: '#dev_null',
            text
        })
        response.send({
            text
        })
    })().catch(next)
})


const errorHandler = (error: any, request: Request, response: Response, next: NextFunction) => {
    console.log(JSON.stringify(error.data, null, 2))
    response.status(500).send({})
}


app.use(errorHandler)
app.listen(port, () => console.log(`listening on port ${port}`))
