const { createServer } = require(`http`)
const parseUrl = require(`url`).parse
const getPort = require(`get-port`)
const RpcClient = require(`renderer/connectors/tendermint-ws.js`).default
const createWsServer = require(`../../helpers/createWebsocketServer`).default

function createHttpServer (port = 26657, onRequest) {
  const server = createServer((req, res) => {
    const { query } = parseUrl(req.url, true)
    const resValue = onRequest(req, query)
    res.end(JSON.stringify(resValue))
  })
  server.listen(port)
  return server
}

describe(`Tendermint Websockets`, () => {
  it(`default constructor`, () => {
    const rpc = new RpcClient()
    expect(rpc.uri).toBe(`http://localhost:26657/`)
    expect(rpc.websocket).toBeFalsy()
  })

  it(`constructor with no protocol`, () => {
    const rpc = new RpcClient(`localhost:1234`)
    expect(rpc.uri).toBe(`http://localhost:1234/`)
    expect(rpc.websocket).toBeFalsy()
  })

  it(`constructor with no port`, () => {
    const rpc = new RpcClient(`https://localhost`)
    expect(rpc.uri).toBe(`https://localhost:26657/`)
    expect(rpc.websocket).toBeFalsy()
  })

  it(`constructor with websocket`, async () => {
    const rpc = new RpcClient(`ws://localhost:26657`)
    expect(rpc.uri).toBe(`ws://localhost:26657/websocket`)
    expect(rpc.websocket).toBeTruthy()
    rpc.close()
  })

  it(`constructor with secure websocket`, async () => {
    const rpc = new RpcClient(`wss://localhost:26657`)
    expect(rpc.uri).toBe(`wss://localhost:26657/websocket`)
    expect(rpc.websocket).toBeTruthy()
    rpc.close()
  })

  it(`http path`, async () => {
    const port = await getPort()
    const server = createHttpServer(port, (req) => {
      expect(req.url).toBe(`/status`)
      return { result: `foo` }
    })
    const rpc = new RpcClient(`http://localhost:${port}`)
    const res = await rpc.status()
    expect(res).toBe(`foo`)
    server.close()
  })

  it(`http arg conversion`, async () => {
    const port = await getPort()
    const server = createHttpServer(port, (req, query) => {
      expect(JSON.parse(query.height)).toBe(`123`)
      return {}
    })
    const rpc = new RpcClient(`http://localhost:${port}`)
    await rpc.commit({ height: 123 })
    server.close()
  })

  it(`http response errors are thrown`, async (done) => {
    const port = await getPort()
    const server = createHttpServer(port, () => {
      return { error: { code: 123, message: `test` } }
    })
    const rpc = new RpcClient(`http://localhost:${port}`)
    try {
      await rpc.commit({ height: 123 })
      done.fail(`should have thrown`)
    } catch (err) {
      expect(err.code).toBe(123)
      expect(err.message).toBe(`test`)
    }
    server.close()
    done()
  })

  it(`http non-response errors are thrown`, async (done) => {
    const rpc = new RpcClient(`http://localhost:0`)
    try {
      await rpc.commit({ height: 123 })
      done.fail(`should have thrown`)
    } catch (err) {
      done()
    }
  })

  it(`ws response error`, async (done) => {
    const port = await getPort()
    const server = createWsServer(port, (req, res) => res({ message: `err` }))
    const rpc = new RpcClient(`ws://localhost:${port}`)
    try {
      await rpc.commit()
      done.fail(`should have thrown`)
    } catch (err) {
      expect(err.message).toBe(`err`)
    }
    rpc.close()
    await server.close()
    done()
  })

  it(`ws arg conversion`, async () => {
    const port = await getPort()
    const server = createWsServer(port, (req, res) => {
      expect(req.method).toBe(`commit`)
      expect(req.params.number).toBe(`123`)
      expect(req.params.buffer).toBe(`0x68656c6c6f`)
      expect(req.params.uint8array).toBe(`0x01020304`)
      res(null, `bar`)
    })
    const rpc = new RpcClient(`ws://localhost:${port}`)
    const res = await rpc.commit({
      number: 123,
      buffer: Buffer.from(`hello`),
      uint8array: new Uint8Array([1, 2, 3, 4])
    })
    expect(res).toBe(`bar`)
    rpc.close()
    await server.close()
  })

  it(`ws subscription`, async () => {
    const port = await getPort()
    const events = []
    const server = createWsServer(port, (req, res) => {
      res(null, {})
      res(null,
        { data: { value: `foo` } },
        `${req.id}#event`)
      res(null,
        { data: { value: `bar` } },
        `${req.id}#event`)
    })
    const rpc = new RpcClient(`ws://localhost:${port}`)
    await new Promise((resolve) => {
      rpc.subscribe({ query: `foo` }, async (event) => {
        events.push(event)
        if (events.length < 2) return
        rpc.close()
        await server.close()
        expect(events).toEqual([`foo`, `bar`])
        resolve()
      })
    })
  })

  it(`ws subscription error`, async (done) => {
    const port = await getPort()
    const server = createWsServer(port, (req, res) => {
      res({ code: 123, message: `uh oh` })
    })
    const rpc = new RpcClient(`ws://localhost:${port}`)
    try {
      await rpc.subscribe({ query: `foo` }, () => {})
      done.fail(`should have thrown`)
    } catch (err) {
      expect(err.code).toBe(123)
      expect(err.message).toBe(`uh oh`)
    }
    rpc.close()
    await server.close()
    done()
  })

  it(`ws disconnect emits error`, async () => {
    const port = await getPort()
    const server = createWsServer(port, (req, res) => res(null, {}))
    const rpc = new RpcClient(`ws://localhost:${port}`)
    await rpc.status()
    const waitForError = new Promise((resolve) => {
      rpc.on(`error`, resolve)
    })
    server.close()
    await waitForError
  })

  it(`ws subscription requires listener`, async (done) => {
    const port = await getPort()
    const server = createWsServer(port, (req, res) => res(null, {}))
    const rpc = new RpcClient(`ws://localhost:${port}`)
    try {
      await rpc.subscribe(`foo`)
      done.fail()
    } catch (err) {
      expect(err.message).toBe(`Must provide listener function`)
    }
    rpc.close()
    server.close()
    done()
  })
})