import { Express, json, urlencoded } from 'express'
// @ts-ignore
import compression from 'compression'

const withMiddlewares = (app: Express) => {
    // app.use(json({ limit: '1mb', type: 'application/*+json'  }))
    // app.use(urlencoded({
    //     extended: false,
    //     type: 'application/x-www-form-urlencoded'
    // }))
    app.use(compression())

    return app
}

export { withMiddlewares }
