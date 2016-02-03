const HttpProxy = require('http-proxy')

module.exports = function (options) {
  const config = {
    proxy: HttpProxy.createProxyServer(),
  }
  Object.assign(config, options)
  config.upstreams = config.upstreams || []
  validateUpstreams(config.upstreams)
  return function* (next) {
    const request = [
      'method', 'path', 'header'
    ].reduce((result, key) => {
      result[key] = this.request[key]
      return result
    }, {})
    const parts = (request.header.host || '').split(':')
    request.host = parts[0] || ''
    request.port = parseInt(parts[1] || 80)
    const upstream = getUpstream(request, config.upstreams)
    if (upstream) {
      yield fetchRequest(this, upstream, config.proxy)
    } else {
      yield next
    }
  }
}

function validateUpstreams(upstreams) {
  upstreams.forEach(upstream => {
    if (upstream.children) {
      validateUpstreams(upstream.children)
    } else if (!upstream.target && !upstream.path) {
      var json = JSON.stringify(upstream)
      if (json.length > 32) json = json.slice(0, 32 + '...')
      throw new Error(`Invalid rule: no target or path is assigned!\n${json}`)
    }
  })
}

function getUpstream(request, upstreams) {
  const config = {}
  return upstreams.find(upstream => {
    if (matchRequest(request, upstream.match)) {
      if (upstream.children) {
        Object.assign(config, getUpstream(request, upstream.children))
        config.match = Object.assign({}, config.match, upstream.match)
      } else {
        Object.assign(config, upstream)
        config.match = Object.assign({}, config.match)
      }
      return true
    }
  }) && config
}

function matchRequest(request, match) {
  if (!match) return true
  if (typeof match === 'function') return match(request)
  return Object.keys(match).every(key => {
    const pattern = match[key]
    const value = request[key]
    if (pattern instanceof RegExp) {
      return pattern.test(value)
    } else if (typeof pattern === 'function') {
      return pattern(value)
    } else {
      return pattern === value
    }
  })
}

function fetchRequest(ctx, upstream, proxy) {
  if (upstream.match.path && upstream.path != null) {
    ctx.path = ctx.path.replace(upstream.match.path, upstream.path)
  }
  var target = upstream.target || ctx.request.header.host
  return new Promise((resolve, reject) => {
    proxy.web(ctx.req, ctx.res, {
      target,
      changeOrigin: true,
    }, e => {
      const status = {
        ECONNREFUSED: 503,
        ETIMEDOUT: 504,
      }[e.code]
      if (status) {
        ctx.status = status
      }
      resolve()
    })
  })
}
