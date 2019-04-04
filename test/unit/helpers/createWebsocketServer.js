const WebSocketServer = require(`ws`).Server

export default function createWsServer (port = 26657, onRequest) {
  const server = new WebSocketServer({ port })
  const connections = []
  server.on(`connection`, (ws) => {
    connections.push(ws)
    ws.on(`message`, (data) => {
      const req = JSON.parse(data.toString())
      const send = (error, result, id = req.id) => {
        const res = { id, error, result }
        ws.send(JSON.stringify(res) + `\n`)
      }
      onRequest(req, send)
    })
  })
  const _close = server.close.bind(server)
  const close = () => {
    connections.forEach((ws) => ws.close())
    _close()
  }
  server.close = close
  return server
}