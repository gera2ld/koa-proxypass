const koa = require('koa')
const proxy = require('..')

const app = koa()

app.use(proxy({
  upstreams: [{
    match: {
      host: 'localhost',
    },
    children: [{
      match: {
        path: /^\/baidu\//,
      },
      target: 'https://www.baidu.com',
      path: '',
    }, {
      target: 'http://gerald.top',
    }],
  }]
}))

const PORT = 4081
app.listen(PORT, e => {
  e ? console.log(e) : console.log(`Listening at port ${PORT}...`)
})
