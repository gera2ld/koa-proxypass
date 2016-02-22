koa-proxypass
===

![NPM](https://img.shields.io/npm/v/koa-proxypass.svg)
![License](https://img.shields.io/npm/l/koa-proxypass.svg)
![Downloads](https://img.shields.io/npm/dt/koa-proxypass.svg)

A proxy-pass server for koa.

Installation
---
``` sh
$ npm install koa-proxypass
```

Usage
---
``` javascript
const koa = require('koa')
const proxy = require('koa-proxypass')

const app = koa()

app.use(proxy({
  upstreams: [{
    match: {
      host: 'localhost',
    },
    children: [{
      match: {
        path: /^\/api\//,
      },
      target: 'http://gerald.top',
      path: '',
    }],
  }]
}))
```

Document
---
There is one parameter `options` for `proxy`. `options` has attributes below:

* `upstreams`

  an array of upstream rules, each rule may have attributes below:

  * `match`: Object | Function (param *request*)

    The object will be tested for each key-value pairs, and return true if all matched. Each value can be an `RegExp` or `Function (param *responding-value*)` for smart test or `Any` for exact match.

    The function will have the request object with `method`, `path`, `header` attributes as the only parameter.

  * `children`: Array

    An array of children `upstreams`

  * `target`: String

    The target server composed of scheme and host, including port.

  * `path`: String | Function

    If provided, the matched path will be replaced with it.

  * `changeOrigin`: Boolean

    Whether `host` should be updated to the target upstream, passed to [http-proxy](https://github.com/nodejitsu/node-http-proxy).
